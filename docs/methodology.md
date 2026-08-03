# Fixture methodology

The published fixture run has five stages:

1. Define a fake-data scenario with a stable fixture hash.
2. Assign one risk class from the ordered taxonomy.
3. Evaluate the scenario against a documented comparator policy.
4. Normalize the modeled result into one typed outcome.
5. Validate publication fields and export the same run as JSON or CSV.

The runner never reads real credentials or executes security-sensitive actions. Scenario outcomes are deterministic rules, and latency fields are placeholders. The fixture matrix is therefore reproducible evidence about the model and export contract, not a live security measurement.

See the full public explanation at [hol.org/guard/research/methodology](https://hol.org/guard/research/methodology).
