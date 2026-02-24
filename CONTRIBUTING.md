# 🤝 Contributing to Gear Lab Pro

Thank you for your interest in improving the Formula Student Drivetrain Optimization Platform! We welcome contributions from engineers, developers, and racing enthusiasts.

---

## 🚀 Getting Started

1. **Fork** the repository
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/gear-lab-pro.git
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## 🏗️ Development Workflow

### Code Standards
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS utility classes only — no inline styles
- **Components**: Follow Atomic Design principles (`src/components/ui/` for primitives)
- **Physics Logic**: All deterministic logic must reside in `src/lib/` with zero React dependencies

### Commit Convention
We follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add Pacejka tire model integration
fix: resolve traction clamping edge case at low RPM
docs: update mathematical model nomenclature
perf: memoize tractive force calculations
```

### Testing
Before submitting a PR, ensure all tests pass:
```bash
npm run test
```

---

## 📐 Areas of Contribution

| Area | Description | Difficulty |
|------|-------------|------------|
| **Physics Engine** | Improve `src/lib/physics.ts` with higher-fidelity models | 🔴 Hard |
| **Optimizer Algorithms** | Add new solvers or improve convergence in `src/lib/optimizer.ts` | 🔴 Hard |
| **UI/UX** | Enhance mobile responsiveness or add new visualizations | 🟡 Medium |
| **Documentation** | Expand mathematical proofs or add tutorials | 🟢 Easy |
| **Testing** | Add unit tests for physics edge cases | 🟡 Medium |
| **Accessibility** | Improve WCAG compliance and screen reader support | 🟡 Medium |

---

## 🐛 Bug Reports

Please use the [Bug Report Template](./.github/ISSUE_TEMPLATE/bug_report.md) and include:
- Browser and OS version
- Steps to reproduce
- Expected vs. actual behavior
- Console error logs (if applicable)

---

## 💡 Feature Requests

Please use the [Feature Request Template](./.github/ISSUE_TEMPLATE/feature_request.md) and describe:
- The engineering problem you're solving
- Your proposed solution
- Impact on competition performance

---

## 📜 Code of Conduct

We are committed to providing a welcoming and inclusive experience. All contributors are expected to adhere to our standards of respectful, constructive collaboration.

---

## 🏁 License

By contributing, you agree that your contributions will be licensed under the MIT License.
