import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FuseAlertComponent, FuseAlertService } from '../../../../@fuse/components/alert';
import { MatIcon } from '@angular/material/icon';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule, MatDatepickerToggle } from '@angular/material/datepicker';
import {
    DateAdapter,
    MAT_DATE_FORMATS,
    MAT_DATE_LOCALE,
    MatDateFormats,
    MatNativeDateModule,
} from '@angular/material/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
    AsyncPipe,
    CurrencyPipe, DatePipe,
    DecimalPipe,
    NgClass,
    NgForOf,
    NgIf,
    TitleCasePipe,
    UpperCasePipe,
} from '@angular/common';
import { MatStep, MatStepLabel, MatStepper } from '@angular/material/stepper';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectSearchComponent } from 'ngx-mat-select-search';
import { MatInputModule } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { ThousandsSeparatorValueAccessor } from '../../../core/directives/thousands-separator-value-accessor';
import { MatCheckbox } from '@angular/material/checkbox';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TravelService } from '../../../core/services/travel.service';
import { TravelDuration, TravelRatesData } from '../../../core/user/user.types';
import { noWhitespaceValidator } from '../../../core/validators/white-space-validator';
import { kenyanPhoneNumberValidator } from '../../../core/validators/kenyan-phone-validator';
import { duplicateTravelerValidator } from '../../../core/validators/duplicator-traveller-validator';
import { startWith, Subject, takeUntil } from 'rxjs';
import { fullNameValidator } from '../../../core/validators/full-name-validator';
import { dobValidator } from '../../../core/validators/dob-validator';
import { UserService } from '../../../core/user/user.service';

// @ts-ignore
export const MY_DATE_FORMATS: MatDateFormats = {
    parse: {
        dateInput: 'DD-MMM-YYYY',
    },
    display: {
        dateInput: 'DD-MMM-YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'DD-MMM-YYYY',
        monthYearA11yLabel: 'MMMM YYYY',
    },
};

@Component({
    selector: 'travel',
    standalone: true,
    templateUrl: './travel-quote.component.html',
    styleUrls: ['./travel-quote.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [
        FuseAlertComponent,
        MatIcon,
        ReactiveFormsModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatProgressSpinner,
        NgIf,
        NgForOf,
        MatStepper,
        MatStep,
        MatSelect,
        MatOption,
        MatFormFieldModule,
        NgClass,
        MatSelectSearchComponent,
        MatStepLabel,
        MatInputModule,
        MatRadioGroup,
        MatRadioButton,
        ThousandsSeparatorValueAccessor,
        DecimalPipe,
        UpperCasePipe,
        TitleCasePipe,
        DatePipe,
        MatCheckbox,
        MatDatepickerToggle,
        AsyncPipe,
        CurrencyPipe,
        DatePipe,

    ],
    providers: [
        DatePipe,
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    ],
})
export class TravelQuoteComponent implements OnInit, OnDestroy
{

    @ViewChild('stepper') stepper!: MatStepper;
    private unsubscribe$ = new Subject<void>();
    quoteForm: FormGroup;
    travelerDetailsForm: FormGroup;
    durations: TravelDuration[] = [];
    rates: TravelRatesData[] = [];
    submissionError: string | null = null;
    isLoadingData: boolean;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private dialog: MatDialog,
        private _fuseAlertService: FuseAlertService,
        private travelService: TravelService,
        private userService: UserService
    ) {
        this.quoteForm = this.fb.group({
            duration: ['4', Validators.required],
            plan: ['', Validators.required],
        });

        this.travelerDetailsForm = this.fb.group({
            email: ['', [Validators.required, Validators.email, noWhitespaceValidator]],
            phoneNumber: ['', [Validators.required, kenyanPhoneNumberValidator, noWhitespaceValidator]],
            numTravelers: [1, [Validators.required, Validators.min(1)]],
            winterSports: [false],
            // UPDATED: Added duplicateTravelerValidator to the FormArray
            travelers: this.fb.array([], [Validators.required, Validators.minLength(1), duplicateTravelerValidator])
        });


    }

    ngOnDestroy(): void {
        this.unsubscribe$.next(); this.unsubscribe$.complete();
    }

    ngOnInit(): void {
        const authUser =  this.userService.getCurrentUser();
        console.log(authUser);
        if(authUser.userType==='C'){
            this.travelerDetailsForm.get('phoneNumber')?.disable();
            this.travelerDetailsForm.get('email')?.disable();
             this.fetchProspectDocuments();
        }
        else{
            this.travelerDetailsForm.get('phoneNumber')?.enable();
            this.travelerDetailsForm.get('email')?.enable();
        }
        this._fuseAlertService.dismiss('submissionError');
        this.loadConfig();
        this.quoteForm.get('duration')?.valueChanges.subscribe(val => {
            if (val) {
                this.loadRates(val);
            }
        });

        this.tdf.numTravelers.valueChanges.pipe(takeUntil(this.unsubscribe$), startWith(this.tdf.numTravelers.value)).subscribe(count => {
            if(count > 0 && this.travelers.length !== count) this.updateTravelersArray(count);
        });
    }

    loadConfig(): void {
        this.travelService.getTravelDurations().subscribe({
            next: (data) => {
                this.durations = data;
            },
            error: (err) => {
                console.error('Error loading durations', err);
            }
        });
    }

    loadRates(durationId): void {
        this.travelService.getRatesByDuration(durationId).subscribe({
            next: (data) => {
                this.rates = data;
            },
            error: (err) => {
                console.error('Error loading rates', err);
            }
        });
    }

    get tdf() { return this.travelerDetailsForm.controls; }

    get travelers() { return this.travelerDetailsForm.get('travelers') as FormArray; }

    moveToNext(): void {

        if (!this.quoteForm.valid) {
            this.submissionError =
                `Please Select Cover Period and Plan to continue...`;
            return;
        }
        this.stepper.next();
    }

    createTravelerGroup(): FormGroup {
        return this.fb.group({
            fullName: ['', [Validators.required, fullNameValidator, noWhitespaceValidator]],
            dob: ['', [Validators.required, dobValidator]]
        });
    }

    updateTravelersArray(count: number): void {
        while (this.travelers.length < count) this.travelers.push(this.createTravelerGroup());
        while (this.travelers.length > count) this.travelers.removeAt(this.travelers.length - 1);
    }

    trimTravelerInput(event: Event, travelerIndex: number, controlName: string): void {
        const input = event.target as HTMLInputElement;
        const originalValue = input.value;
        const sanitizedValue = originalValue.trim();

        if (sanitizedValue !== originalValue) {
            const travelerControl = this.travelers.at(travelerIndex);
            travelerControl.patchValue({ [controlName]: sanitizedValue });
            input.value = sanitizedValue;
        }
    }

    preventLeadingSpace(event: KeyboardEvent): void {
        const input = event.target as HTMLInputElement;
        const cursorPosition = input.selectionStart || 0;

        // Prevent space if:
        // 1. Input is empty or only whitespace
        // 2. Cursor is at position 0 (beginning)
        if (event.key === ' ') {
            if (!input.value || input.value.trim().length === 0 || cursorPosition === 0) {
                event.preventDefault();
            }
        }
    }

    getAge(dob: string | Date | null): number | null {
        if (!dob) return null;
        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) return null; // Invalid date

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }



    handleInputChange(event: Event, controlName: string): void {
        const input = event.target as HTMLInputElement;
        let value = input.value;

        // Remove leading spaces
        if (value !== value.trimStart()) {
            const cursorPosition = input.selectionStart || 0;
            const trimmedValue = value.trimStart();
            const removedChars = value.length - trimmedValue.length;

            // Update the input value
            input.value = trimmedValue;

            // Update form control
            if (controlName === 'email' || controlName === 'phoneNumber') {
                this.travelerDetailsForm.patchValue({ [controlName]: trimmedValue }, { emitEvent: false });
            }

            // Adjust cursor position
            const newPosition = Math.max(0, cursorPosition - removedChars);
            input.setSelectionRange(newPosition, newPosition);
        }
    }

    trimInput(event: Event, controlName: string): void {
        const input = event.target as HTMLInputElement;
        const originalValue = input.value;

        // For email, strip ALL whitespace; otherwise trim leading/trailing
        const sanitizedValue = controlName === 'email'
            ? originalValue.replace(/\s+/g, '')
            : originalValue.trim();

        if (sanitizedValue !== originalValue) {
            // Update form control value
            if (controlName === 'email' || controlName === 'phoneNumber') {
                this.travelerDetailsForm.patchValue({ [controlName]: sanitizedValue });
            }

            // Update input field
            input.value = sanitizedValue;
        }
    }

    fetchProspectDocuments(): void {
        this.isLoadingData = true;
        this.userService.getUserDetails().subscribe({
            next: (data) => {
                this.isLoadingData = false;
                this.travelerDetailsForm.patchValue({
                    phoneNumber: data.phoneNumber,
                    email: data.emailAddress,
                });
            },
            error: (err) => {
                this.isLoadingData = false;
            }
        });
    }


}
