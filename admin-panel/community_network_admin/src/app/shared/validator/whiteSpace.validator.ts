import { AbstractControl, ValidationErrors } from '@angular/forms';  
    
export class WhiteSpaceValidator {  
    static cannotContainSpace(control: AbstractControl) : ValidationErrors | null {  
        if (control.value && control.value.startsWith(' ')) {
            return {cannotContainSpace: true};
          }
          // if (control.value && control.value.endsWith(' ')) {
          //   return {cannotContainSpace: true};
          // }
        
        return null;  
    }  
}  
