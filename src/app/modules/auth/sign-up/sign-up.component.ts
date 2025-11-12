import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    AbstractControl, FormBuilder,
    FormGroup,
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup, ValidationErrors, ValidatorFn,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { finalize } from 'rxjs';
import { CreateUserObject } from '../../../core/user/user.types';
import { MatRadioModule } from '@angular/material/radio';
import { CommonModule } from '@angular/common';


export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password && confirmPassword && password.value === confirmPassword.value ? null : { passwordMismatch: true };
};


@Component({
    selector: 'auth-sign-up',
    templateUrl: './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    imports: [
        RouterLink,
        CommonModule,
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatRadioModule,
        MatProgressSpinnerModule,
    ],
})



export class AuthSignUpComponent implements OnInit {
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    formType: 'login' | 'register' = 'login';
    registerForm!: FormGroup;
    showAlert: boolean = false;
    showPassword = false;
    showTermsModal = false;
    showDataPrivacyModal = false;

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private fb: FormBuilder,
        private _router: Router
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.registerForm = this.fb.group({
            accountType: ['C', Validators.required],
            fullName: ['', [Validators.required, this.fullNameValidator]],
            email: ['', [Validators.required, Validators.email]],
            kraPin: ['', [Validators.required, this.kraPinValidator]],
            phoneNumber: ['', [Validators.required, this.phoneNumberValidator]],
            iraNumber: [''],
            pinNumber: [''],
            password: ['', [Validators.required, this.strongPasswordValidator]],
            confirmPassword: ['', Validators.required],
            agreementAccepted: [false, Validators.requiredTrue],
        }, { validators: passwordMatchValidator });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------



    register(): void {
        if (this.registerForm.invalid || this.registerForm.disabled) return;
        this.registerForm.disable();
        const formValue = this.registerForm.getRawValue();
        const user: CreateUserObject = {
            password: formValue.password,
            passwordConfirm: formValue.confirmPassword,
            pinNumber: formValue.kraPin,
            mobileno: formValue.phoneNumber,
            docnumber: formValue.iraNumber,
            firstName: formValue.fullName,
            email: formValue.email,
            clientType: formValue.accountType
        };

        this._authService.createUser(user).pipe(
            finalize(() => this.registerForm.enable())
        ).subscribe({
            next: () => {
                this.alert = { type: 'success', message: 'Registration successful! Please sign in.'};
                this.showAlert = true;
                this.formType = 'login';
                setTimeout(() => this.showAlert = false, 5000);
            },
            error: (err) => {
                this.alert = { type: 'error', message: err.error?.errors?.[0]?.developerMessage || 'Registration failed.' };
                this.showAlert = true;
            },
        });
    }

    get password() { return this.registerForm.get('password'); }
    get confirmPassword() { return this.registerForm.get('confirmPassword'); }

    fullNameValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null;
        const names = control.value.trim().split(' ').filter((name: string) => name.length > 0);
        return names.length >= 2 ? null : { fullNameInvalid: true };
    }

    kraPinValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null;
        return /^[A-Za-z]\d{9}[A-Za-z]$/.test(control.value) ? null : { kraPinInvalid: true };
    }

    phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null;
        return /^\+254\d{9,12}$/.test(control.value) ? null : { phoneNumberInvalid: true };
    }

    strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) return null;
        const value = control.value;
        const valid = /(?=.*[a-z])/.test(value) && /(?=.*[A-Z])/.test(value) && /(?=.*\d)/.test(value) && /(?=.*[@$!%*?&])/.test(value) && value.length >= 8;
        return valid ? null : { strongPasswordInvalid: true };
    }

    onKraPinChange(event: any): void {
        let value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        this.registerForm.get('kraPin')?.setValue(value.substring(0, 11), { emitEvent: false });
    }

    onPhoneNumberChange(event: any): void {
        let value = event.target.value.replace(/[^\d+]/g, '');
        if (!value.startsWith('+254') && value.length > 0) {
            if (value.startsWith('0')) value = '+254' + value.substring(1);
            else if (value.startsWith('254')) value = '+' + value;
            else if (!value.startsWith('+')) value = '+254' + value;
        }
        this.registerForm.get('phoneNumber')?.setValue(value.substring(0, 13), { emitEvent: false });
    }

    // --- Password strength helper methods for the HTML template ---
    hasMinLength(password: string): boolean { return !!password && password.length >= 8; }
    hasLowercase(password: string): boolean { return !!password && /(?=.*[a-z])/.test(password); }
    hasUppercase(password: string): boolean { return !!password && /(?=.*[A-Z])/.test(password); }
    hasNumber(password: string): boolean { return !!password && /(?=.*\d)/.test(password); }
    hasSpecialChar(password: string): boolean { return !!password && /(?=.*[@$!%*?&])/.test(password); }


    togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }
    getCurrentDate(): string { return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
}
