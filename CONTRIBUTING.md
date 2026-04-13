# Contributing to SoulJBC/Draw

Thank you for your interest in contributing to the SoulJBC/Draw repository! In order to facilitate a smooth contribution process, please follow the guidelines outlined below:

## Fork and Clone Instructions
1. **Fork the repository**: Click the 'Fork' button at the top right of the page.
2. **Clone your fork**: Once you've forked the repository, clone it to your local machine using the command:
   ```
   git clone https://github.com/<your-username>/Draw.git
   ```
3. **Navigate into the project directory**:
   ```
   cd Draw
   ```

## Code Standards and Style Guide
- Follow the coding style used in the existing codebase for consistency.
- Use meaningful variable and function names.
- Ensure proper indentation and spacing (typically 4 spaces for Python and 2 spaces for JavaScript).
- Comment your code adequately to explain complex logic.

## Pull Request Process
1. **Create a new branch**: Before making changes, create a new branch based on main:
   ```
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** and commit them with a descriptive commit message:
   ```
   git commit -m "Add feature: describe what you did"
   ```
3. **Push your changes** to your fork:
   ```
   git push origin feature/your-feature-name
   ```
4. **Open a Pull Request**: On GitHub, navigate to the 'Pull Requests' tab and click 'New Pull Request'. Select your branch and submit the pull request for review.

## Commit Message Conventions
- Use the format `type(scope): subject` for commit messages.
  - `type` can be `feat` (new feature), `fix` (bug fix), `docs` (documentation), `style` (formatting), etc.
  - Example: `feat(api): add new endpoint for retrieving data`

## Testing Requirements
- Ensure all existing and new tests pass before submitting a pull request.
- Follow the testing framework and structure used in the repository.
- Write unit tests for any new features or fixes.

Thank you for contributing! We appreciate your effort and help in making this project better.