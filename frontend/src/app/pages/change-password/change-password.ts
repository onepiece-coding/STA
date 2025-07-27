import { Component } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, Toast, InputTextModule, ButtonModule],
  providers: [MessageService],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword {
  currentPassword!: FormControl;
  newPassword!: FormControl;
  confirmPassword!: FormControl;
  changePasswordFormData!: FormGroup;

  loading = false;

  constructor(
    private readonly _authService: AuthService,
    private readonly _messageService: MessageService
  ) {
    this.initFormControls();
    this.initFormGroup();
  }

  private initFormControls(): void {
    this.currentPassword = new FormControl('', [Validators.required]);
    this.newPassword = new FormControl('', [Validators.required]);
    this.confirmPassword = new FormControl('', [
      this.passwordsMatchValidator(this.newPassword),
    ]);
  }

  private initFormGroup(): void {
    this.changePasswordFormData = new FormGroup({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword,
    });
  }

  private passwordsMatchValidator(
    newPasswordControl: AbstractControl
  ): ValidatorFn {
    return (
      confirmPasswordControl: AbstractControl
    ): ValidationErrors | null => {
      if (
        confirmPasswordControl.value !== newPasswordControl.value ||
        confirmPasswordControl.value === ''
      ) {
        return { passwordNotMatch: true };
      }
      return null;
    };
  }

  onSubmit() {
    if (this.changePasswordFormData.invalid) {
      this.changePasswordFormData.markAllAsDirty();
      this.changePasswordFormData.markAllAsTouched();
    } else {
      this.loading = true;
      const { currentPassword, newPassword, confirmPassword } =
        this.changePasswordFormData.value;
      this.changePassword(currentPassword, newPassword, confirmPassword);
    }
  }

  private changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) {
    this._authService
      .changePassword(currentPassword, newPassword, confirmPassword)
      .subscribe({
        next: ({ message }) => {
          this.loading = false;
          this.changePasswordFormData.reset();
          this.showAlert('success', 'Changer le mot de passe', message);
        },
        error: (mistake) => {
          console.log('changePassword():', mistake);
          this.loading = false;
          this.changePasswordFormData.reset();
          this.showAlert(
            'error',
            mistake.statusText,
            mistake.error.message || 'Échec du changement de mot de passe.'
          );
        },
      });
  }

  private showAlert(severity: string, summary: string, detail: string) {
    this._messageService.add({
      severity: severity,
      summary: summary,
      detail: detail,
      life: 3000,
    });
  }
}
