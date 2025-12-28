export interface DialogDataModel {
  dialogTitle?:string;
  contentName: string;
  actionName: string;
}

export interface AlertDialogDataModel {
  dialogTitle?:string;
  dialogMessage: string;
}

export interface AlertDialogNotificationDataModel {
  title?: string
  dialogTitle?:string;
  dialogMessage: string;
}


export interface DisplayPdfModel {
  dialogTitle?:string;
  communityId: string;
  dialogMessage?: string;
  pdfLink: string;
  bankcheckStatus?: any;
}

export interface DialogAddSMS{
  dialogTitle?: string,
  contentName?: string,
  actionName?: string,
  communityId?: string,
  smsRemaining?: any,
  emailRemaining?: any,
  communityDescription?: string,
  sms?:any,
  email?:any
  //inputType: any
}

