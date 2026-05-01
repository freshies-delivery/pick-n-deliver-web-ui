import { Component, HostListener, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  loginModalOpen = false;
  loginEmail = '';
  loginPassword = '';
  loginError = '';
  menuOpen = false;
  scrolled = false;

  private observer?: IntersectionObserver;
  private statsObserver?: IntersectionObserver;
  private statsAnimated = false;

  constructor(private auth: AuthService, private router: Router) {}

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 20;
  }

  openLogin() {
    this.loginModalOpen = true;
    this.loginError = '';
  }

  closeLogin() {
    this.loginModalOpen = false;
    this.loginEmail = '';
    this.loginPassword = '';
    this.loginError = '';
  }

  submitLogin() {
    if (!this.loginEmail || !this.loginPassword) {
      this.loginError = 'Please enter your email and password.';
      return;
    }
    if (this.loginPassword.length < 6) {
      this.loginError = 'Password must be at least 6 characters.';
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.loginEmail)) {
      this.loginError = 'Please enter a valid email address.';
      return;
    }
    this.auth.login(this.loginEmail, this.loginPassword);
    this.closeLogin();
    this.router.navigate(['/dashboard']);
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') this.closeLogin();
    if (e.key === 'Enter') this.submitLogin();
  }

  ngAfterViewInit() {
    // Scroll-triggered entrance animations
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => this.observer!.observe(el));

    // Count-up stats animation
    this.statsObserver = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting) && !this.statsAnimated) {
        this.statsAnimated = true;
        document.querySelectorAll('.big-stat[data-target]').forEach(el => {
          const target = parseInt(el.getAttribute('data-target') || '0');
          const suffix = el.getAttribute('data-suffix') || '';
          const divisor = parseInt(el.getAttribute('data-divisor') || '1');
          let start = 0;
          const duration = 2000;
          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const val = Math.floor((target / divisor) * eased);
            el.textContent = val + suffix;
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              el.textContent = (target / divisor) + suffix;
            }
          };
          requestAnimationFrame(step);
        });
      }
    }, { threshold: 0.3 });

    const statsBar = document.querySelector('.stats-bar');
    if (statsBar) this.statsObserver.observe(statsBar);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.statsObserver?.disconnect();
  }
}
