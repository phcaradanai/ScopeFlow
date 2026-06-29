# Brief Readiness UI

`BriefReadinessPanel` renders the output from `evaluateBriefReadiness()`.

Intended next wiring point:

- `src/components/BriefIntakeModal.tsx`
- compute `const briefReadiness = evaluateBriefReadiness(formData.raw_request, aiDigest || undefined)`
- render `<BriefReadinessPanel readiness={briefReadiness} />` in the right-hand intake column before `ScopeDigestPreview`
- use `briefReadiness.shouldCreateQuotation` as a user-facing warning before quotation-related draft actions

This keeps Brief Assistant focused on the core pain point: ask the right questions before turning a vague customer request into scope or quotation artifacts.
