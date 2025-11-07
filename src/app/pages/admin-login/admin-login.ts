import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { AuthService } from '../../services/AuthService';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-admin-login',
  standalone: false,
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss',
  providers: [MessageService]
})
export class AdminLogin {
  loading = false;
  errorMessage = '';
  loginForm: any;
  private ngUnsubscribe = new Subject();

  constructor(private fb: FormBuilder, private authService: AuthService,
    private router: Router, private messageService: MessageService
  ) { }

  // Convenience getters for template access
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }


  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.errorMessage = 'Please fill all fields correctly.';
      return;
    }

    const { email, password } = this.loginForm.value;
    if (!email || !password) return;

    this.loading = true;
    try {

      this.authService.login(email, password)
        .then((userCredential) => {
          this.messageService.add({ severity: 'success', summary: 'Login Successful!', detail: 'Welcome back!' });
          this.loginForm.reset();
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 4000);
        })
        .catch((error) => {
          this.messageService.add({ severity: 'error', summary: 'Login Failed', detail: error.message });

        });


    } catch (error: any) {
      if (error.code === 'auth/user-not-found') this.errorMessage = 'User not found.';
      else if (error.code === 'auth/wrong-password') this.errorMessage = 'Incorrect password.';
      else this.errorMessage = 'Login failed. Try again.';
    } finally {
      this.loading = false;
    }
  }
}
