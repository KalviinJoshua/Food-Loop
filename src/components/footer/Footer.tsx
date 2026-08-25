import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-section-gap px-container-padding flex flex-col items-center gap-stack-md bg-surface-dim border-t border-outline-variant mt-auto">
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-2">
          <span className="font-headline-md text-headline-md font-bold text-primary mb-4 block">
            FoodBridge
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mb-6">
            Building a zero-waste future through intelligent logistics and community partnership.
          </p>
          <div className="flex gap-4">
            <a
              href="#earth"
              className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
            >
              <span className="material-symbols-outlined">public</span>
            </a>
            <a
              href="#share"
              className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
            >
              <span className="material-symbols-outlined">share</span>
            </a>
            <a
              href="#mail"
              className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
            >
              <span className="material-symbols-outlined">mail</span>
            </a>
          </div>
        </div>
        <div>
          <h4 className="font-label-md text-label-md text-primary font-bold mb-6">Company</h4>
          <ul className="space-y-4">
            <li>
              <a
                href= "/about.html"
                className="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline transition-all"
              >
                About Us
              </a>
            </li>
            <li>
              <a
                href="careers.html"
                className="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline transition-all"
              >
                Careers
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-label-md text-label-md text-primary font-bold mb-6">Legal</h4>
          <ul className="space-y-4">
            <li>
              <a
                href="#privacy"
                className="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline transition-all"
              >
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="#terms"
                className="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline transition-all"
              >
                Terms of Service
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="w-full pt-8 border-t border-outline-variant/30 text-center">
        <p className="font-caption text-caption text-on-surface-variant">
          © 2026 FoodBridge. Recovering food, restoring hope.
        </p>
      </div>
    </footer>
  );
};
