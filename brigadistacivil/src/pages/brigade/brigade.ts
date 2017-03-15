import { Component, ViewChild, ElementRef } from '@angular/core';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import { App, NavController, NavParams, AlertController,ToastController } from 'ionic-angular';
import BasePage from '../basepage';
import {BrigadesPage} from './brigades'
import { UserService } from '../../providers/user-service';
import { BrigadeService } from '../../providers/brigade-service';
import { GeneralService } from '../../providers/general-service';
import {TranslateService} from 'ng2-translate';
declare var google;

@Component({
  selector: 'page-brigade',
  templateUrl: 'brigade.html'
})
export class BrigadePage  extends BasePage{
  public brigade: any;
  public position: any;
  public isBrigade: boolean;
  public isLeader: boolean;
  @ViewChild('map') mapElement: ElementRef;
  brigadeForm: FormGroup;
  brigadeFormFields: any;
  public readonly: boolean;

  constructor(public app: App, public navCtrl: NavController, public navParams: NavParams,
    public translateService: TranslateService,public brigadeService: BrigadeService, public alertCtrl: AlertController,
    public userService: UserService,public toastCtrl: ToastController, public fb: FormBuilder,
    public generalService: GeneralService) {
    super();

    if(this.navParams.get("brigade")){
      this.brigade=this.navParams.get("brigade");
      this.loadData();
    } else{
      this.brigade={};
      this.readonly=false;
    }
    this.brigadeFormFields={
      name: ['', [<any>Validators.required, <any>Validators.minLength(5)]],
      city: ['', [<any>Validators.required, <any>Validators.minLength(5)]],
      description: ['']
    };
    this.brigadeForm = this.fb.group(this.brigadeFormFields);
  }

  isInBrigade(){
    return this.isBrigade && this.brigade._id!=null;
  }

  isInLeaderes(){
    return this.isLeader && this.brigade._id!=null;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad BrigadePage');

  }

  showMap(){
    let cb = ()=>{
        this.map = this.generalService.loadMap(this.mapElement,this.position.coords,{scrollwheel: false});
        this.generalService.drawPolygon(this.map, [],cb) ;

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

  loadData(){
    if(!this.brigade) return;
    this.brigadeService.getBrigade(this.brigade._id).then(d=>{
      this.brigade=d;
      this.setDataForm(this.brigadeForm,this.brigadeFormFields,this.brigade);
      this.isLeader = this.brigade.leaders && this.brigade.leaders.find(d=>{return d._id==UserService.loginData._id})!=null

      this.isBrigade = this.isLeader ||
              this.brigade.brigades && this.brigade.brigades.find(d=>{return d._id==UserService.loginData._id})!=null ||
              this.brigade.requested && this.brigade.requested.find(d=>{return d._id==UserService.loginData._id})!=null;

      if(this.brigade && this.brigade.leaders && this.brigade.leaders.find(d=>{return d._id==UserService.loginData._id}))
        this.readonly=false;
      else this.readonly=true;
    });
  }

  save(){
    this.brigadeService.addBrigade(this.brigadeForm.value).then(d=>{
      if(this.brigade._id){
        this.showToast(this.translate("brigade.update"));
      }else{
        this.showToast(this.translate("brigade.new.warning"));
        this.openPage(BrigadesPage);
      }
    });
  }

  requestEnter(){
    let message=this.translate("brigade.requestEnter.confirm");
    let title=this.translate("brigade.requestEnter.action");
    this.showConfirm(message, title, confirm=>{
      this.brigadeService.addRelationBrigade(this.brigade._id,"requested").then(d=>{
        this.showToast(this.translate("brigade.requestEnter.feedback"));
        this.loadData();
      });
    });
  }

  leaveBrigade(){
    let message=this.translate("brigade.leaveBrigade.confirm");
    let title=this.translate("brigade.leaveBrigade.action");
    this.showConfirm(message, title, confirm=>{
      this.brigadeService.removeRelationBrigade(this.brigade._id,"requested").then(d=>{
        this.showToast(this.translate("brigade.leaveBrigade.feedback"));
        this.loadData();
      });
    });

  }

  approveBrigade(userId){
    let message=this.translate("brigade.approveBrigade.confirm");
    let title=this.translate("brigade.approveBrigade.action");
    this.showConfirm(message, title, confirm=>{
      this.brigadeService.addRelationBrigade(this.brigade._id,"brigades",userId).then(d=>{
        this.showToast(this.translate("brigade.approveBrigade.feedback"));
        this.loadData();
      });
    })
  }

  promoteBrigade(userId){
    let message=this.translate("brigade.promoteBrigade.confirm");
    let title=this.translate("brigade.promoteBrigade.action");
    this.showConfirm(message, title, confirm=>{
      this.brigadeService.addRelationBrigade(this.brigade._id,"leaders",userId).then(d=>{
        this.showToast(this.translate("brigade.promoteBrigade.feedback"));
        this.loadData();
      });
    })
  }

}
