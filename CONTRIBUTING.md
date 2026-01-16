# Contributing to ShishuKotha

Thank you for your interest in contributing to ShishuKotha! This document provides guidelines for contributing to the project.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (browser, OS, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide detailed description** of the proposed feature
- **Explain why this enhancement would be useful**
- **Include mockups or examples** if applicable

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the code style guidelines
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Write clear commit messages**
6. **Submit the pull request**

## Code Style Guidelines

### JavaScript

- Use ES6+ features where appropriate
- Follow consistent indentation (2 spaces)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

```javascript
// Good
function generateStoryIdeas(count) {
  // Generate story ideas using AI
  const ideas = [];
  // ...
  return ideas;
}

// Avoid
function gen(c) {
  var i = [];
  // ...
  return i;
}
```

### Google Apps Script

- Follow Google's Apps Script best practices
- Use `const` and `let` instead of `var`
- Handle errors gracefully
- Log important operations
- Add JSDoc comments for functions

```javascript
/**
 * Generate story ideas using AI
 * @param {number} count - Number of ideas to generate
 * @returns {Array} Array of story ideas
 */
function generateStoryIdeas(count) {
  try {
    // Implementation
  } catch (error) {
    logMessage('Error: ' + error.message, 'ERROR');
    throw error;
  }
}
```

### HTML/CSS

- Use semantic HTML5 elements
- Follow BEM naming convention for CSS classes
- Keep CSS modular and reusable
- Ensure mobile responsiveness
- Test across different browsers

## Testing

Before submitting a PR:

- [ ] Test the dashboard loads correctly
- [ ] Verify all interactive features work
- [ ] Check Apps Script functions execute without errors
- [ ] Test on multiple screen sizes
- [ ] Verify API integrations work (if applicable)

## Documentation

Update documentation when:

- Adding new features
- Changing existing functionality
- Updating configuration options
- Modifying API integrations

Documentation to update:

- README.md (if feature is user-facing)
- Relevant docs/ files
- Inline code comments
- JSDoc comments

## Commit Messages

Use clear and descriptive commit messages:

```
feat: Add support for multiple aspect ratios
fix: Resolve API timeout issue in story generation
docs: Update API integration guide with Gemini example
style: Improve dashboard mobile responsiveness
refactor: Simplify media package creation logic
```

Prefixes:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style/formatting
- `refactor:` Code refactoring
- `test:` Adding/updating tests
- `chore:` Maintenance tasks

## Areas for Contribution

We welcome contributions in these areas:

### High Priority

- FFmpeg integration for video assembly
- Additional AI API integrations
- Improved error handling
- Performance optimizations
- Mobile app version

### Medium Priority

- Social media auto-posting
- Analytics dashboard
- Theme customization
- Multiple language support
- Batch generation improvements

### Good First Issues

- UI/UX improvements
- Documentation enhancements
- Additional story templates
- Bug fixes
- Code cleanup

## Questions?

Feel free to open an issue for:
- Questions about the codebase
- Clarifications on contribution process
- Feature discussions
- General feedback

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to ShishuKotha!** 🙏
