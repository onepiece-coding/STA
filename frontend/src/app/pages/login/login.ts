import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, Toast, InputTextModule, ButtonModule],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  username!: FormControl;
  password!: FormControl;
  loginFormData!: FormGroup;

  loading = false;

  constructor(
    private readonly _authService: AuthService,
    private readonly _messageService: MessageService,
    private readonly _router: Router
  ) {
    this.initFormControls();
    this.initFormGroup();
  }

  initFormControls(): void {
    this.username = new FormControl('', [Validators.required]);
    this.password = new FormControl('', [Validators.required]);
  }

  initFormGroup(): void {
    this.loginFormData = new FormGroup({
      username: this.username,
      password: this.password,
    });
  }

  onSubmit() {
    if (this.loginFormData.invalid) {
      this.loginFormData.markAllAsDirty();
      this.loginFormData.markAllAsTouched();
    } else {
      this.loading = true;
      const { username, password } = this.loginFormData.value;
      this.signIn(username, password);
    }
  }

  signIn(username: string, password: string) {
    this._authService.login(username, password).subscribe({
      next: ({ accessToken }) => {
        this._authService.setToken(accessToken);
        this._authService.loadCurrentUser().subscribe({
          next: (user) => {
            this.loading = false;
            this.loginFormData.reset();
            this._router.navigateByUrl(`/${user.role}`);
          },
          error: (mistake) => {
            console.log('signIn() => loadCurrentUser():', mistake);
            this.loading = false;
            this.showAlert(
              'error',
              mistake.statusText,
              mistake.error.message || 'Failed to load user. Please try again.'
            );
          },
        });
      },
      error: (mistake) => {
        console.log('signIn() => login():', mistake);
        this.loading = false;
        this.loginFormData.reset();
        this.showAlert(
          'error',
          mistake.statusText,
          mistake.error.message || 'Login failed. Please try again.'
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
