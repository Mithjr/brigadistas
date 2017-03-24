import { Component, ViewChild, ElementRef } from '@angular/core';
import { App,NavParams, AlertController,ToastController } from 'ionic-angular';
import { UserService } from '../../providers/user-service';
import BasePage from '../basepage';
import { BrigadeService } from '../../providers/brigade-service';
import { GeneralService } from '../../providers/general-service';
import {TranslateService} from 'ng2-translate';
declare var google;

@Component({
  selector: 'page-area',
  templateUrl: 'area.html'
})
export class AreaPage extends BasePage {
  public brigade: any;
  public position: any;
  public isBrigade: boolean;
  public isLeader: boolean;
  @ViewChild('map') mapElement: ElementRef;
  public readonly: boolean;
  map: any;
  valid: boolean;
  public selectedShape: any;

  constructor(public app: App, public navParams: NavParams,
    public translateService: TranslateService,public alertCtrl: AlertController,
    public userService: UserService,public toastCtrl: ToastController,
    public generalService: GeneralService, public brigadeService: BrigadeService) {
      super();
  }

  ionViewDidLoad() {
    this.loadData(false);
  }

  loadData(force){
    if(this.navParams.get("brigade") && !force){
      this.brigade=this.navParams.get("brigade");
      this.readonly=this.navParams.get("readonly");
      const {isLeader,isBrigade,readonly} = this.brigadeService.userPerms(UserService.loginData,this.brigade);
      this.isLeader=isLeader; this.isBrigade=isBrigade; this.readonly=readonly;
      this.showMap();
      //TODO: this.valid=false;
    } else if(this.navParams.get("brigadeId")){
      this.brigadeService.getBrigade(this.navParams.get("brigadeId")).then(d=>{
        this.brigade=d;
        const {isLeader,isBrigade,readonly} = this.brigadeService.userPerms(UserService.loginData,this.brigade);
        this.isLeader=isLeader; this.isBrigade=isBrigade; this.readonly=readonly;
        this.showMap();
      });
    }else{
      this.brigade={};
      this.readonly=false;
      this.valid=false;
    }
  }

  showMap(){
    let cb = ()=>{
      let coords;
      GeneralService.polygons=<any>[];
      if(this.position)coords=this.position.coords;
        this.map = this.generalService.loadMap(this.mapElement,coords,{scrollwheel: false});

        let selectShapeCb = (function(obj){
            return shape=>{
              obj.selectedShape = shape;
            };
          })(this);

        if(this.brigade.area && (this.brigade.area.coordinates || this.brigade.area.length>0)){
          let a=this.brigade.area;
          if(this.brigade.area.coordinates) a=this.brigade.area.coordinates;
          a.forEach(area=>{
            let areas= area.map(a=>{
              return {lat: a[1], lng: a[0]};
            });
            this.generalService.addPolygon(this.map,areas,selectShapeCb);
          });
          if(a.length==0 && !this.readonly) this.generalService.drawPolygon(this.map, [],null, selectShapeCb);
        }else{
          let newPolyCb = p=>{
            if(p.getPath().b.length>2){
              this.valid=true;
              this.readonly=false;
            }
          };
          if(!this.readonly) this.generalService.drawPolygon(this.map, [],newPolyCb, selectShapeCb);
        }
    }

    let addPosition= (pos)=>{
      this.position=pos;
      cb();
    }

    if(!this.position){
      this.generalService.getPosition(addPosition);
    }else{
      cb();
    }

  }

  remove(){
    this.showConfirm(this.translate("remove"), null,c=>{
      this.generalService.deleteSelectedShape();
    });
  }

  save(){
    if(!GeneralService.selectedShape){
      //this.openPageParam(BrigadePage, {brigade: this.brigade, brigadeId: this.brigade._id});
      return
    }
    let paths=[]
    GeneralService.polygons.forEach(p=>{
      p.getPath().b.forEach(b=>{
        paths.push([b.lng(), b.lat()]);
      });
    });
    if(!this.brigade.area) this.brigade.area={coordinates: []};
    else if(!this.brigade.area.coordinates) this.brigade.area.coordinates=[];
    this.brigade.area.coordinates = paths;

    this.brigadeService.updateBrigade({
      _id: this.brigade._id,
      area: this.brigade.area
    }).then(c=>{
      this.showToast(this.translate("brigade.area.save"));
      this.loadData(true);
    });
  }

}