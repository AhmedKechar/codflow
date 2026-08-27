---
name: implement
description: "Implement a piece of work based on a spec or set of tickets. Integrates with team workflow."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

## Team Integration

This skill is called by the `orchestrator` after planning is complete. The workflow is:

1. **Builder** implements the code
2. **Tester** writes tests and verifies
3. **Security** reviews for vulnerabilities
4. **Reviewer** approves code quality
5. **Financial-auditor** verifies calculations (if financial feature)
6. **DevOps** guides deployment (if needed)
7. **Documenter** updates documentation (if needed)

## Implementation Process

1. Read the spec/tickets provided by the orchestrator
2. Implement the code following existing patterns
3. Ensure validation on all layers (UI, API, DB, Business Logic)
4. Ensure error handling is graceful
5. Ensure performance is acceptable

## Quality Gates

Before marking implementation complete, verify:

- [ ] Code follows existing patterns
- [ ] Validation implemented on all layers
- [ ] Error handling is graceful
- [ ] Type checking passes
- [ ] Tests pass
- [ ] No security vulnerabilities

## Non-Functional Requirements

### Security
- Never trust client input
- Use parameterized queries
- Implement CSRF protection
- Sanitize all user inputs

### Validation
- Validate on ALL layers (UI, API, DB, Business Logic)
- Use Zod schemas for runtime validation
- TypeScript strict mode for compile-time validation
- CHECK constraints in database
- Return clear error messages

### Data Integrity
- CHECK constraints for positive values
- FOREIGN KEY constraints for relationships
- State machine validation for status transitions
- Audit trail for all mutations

### Performance
- Implement caching (multi-level)
- Use connection pooling
- Add timeouts to all external calls
- Implement error boundaries
- Optimize database queries

### Scalability
- Follow SOLID principles
- Use dependency injection
- Keep functions small and focused
- Write modular, reusable code

## Commands

```bash
# Typecheck
cd cod-server && npm run typecheck
cd cod-client && npm run typecheck

# Test
cd cod-server && npm test
cd cod-client && npm test
```

## Completion

Once implementation is complete:

1. Run typecheck in affected packages
2. Run test suite
3. Hand off to `tester` for verification
4. Document any significant decisions
