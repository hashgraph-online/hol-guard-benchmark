# Security policy

## Reporting a vulnerability

Do not open a public issue for a vulnerability. Email [security@hol.org](mailto:security@hol.org) with the affected file or workflow, reproduction steps, impact, and any known mitigation.

This repository contains fake-data fixtures and does not execute real attacks. A defect in the fixture runner can still affect published evidence, generated artifacts, or CI; report those privately when they could create a security or integrity risk.

## Safe contribution boundary

Never add real secrets, credentials, private keys, production logs, customer data, or commands that contact third-party systems to fixtures. New live adapters require a separate design review and must document data egress, isolation, consent, and raw-observation retention before implementation.
