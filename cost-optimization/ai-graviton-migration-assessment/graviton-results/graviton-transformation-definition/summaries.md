# Reference Documentation Summaries

## AWS Porting Advisor for Graviton Integration

This transformation leverages compatibility rules and patterns from the AWS Porting Advisor for Graviton project to provide accurate ARM64 migration assessment.

### Key Reference Data Sources

#### Language-Specific Compatibility Rules
- **Python**: 100+ library compatibility rules with minimum ARM64 versions
- **Java**: Native library analysis and JNI dependency requirements  
- **Go**: Version requirements and module compatibility
- **C/C++/Fortran**: Architecture-specific intrinsics and assembly patterns
- **Node.js, Ruby, C#**: Runtime and dependency compatibility matrices

#### Architecture Detection Patterns
- **x86 Intrinsics**: SSE, AVX, AVX-512 instruction detection
- **ARM64 Equivalents**: NEON, SVE instruction mappings
- **Assembly Code**: Architecture-specific assembly pattern recognition
- **Build System Issues**: Autoconf, CMake, and Makefile compatibility

#### Compatibility Database Structure
```json
{
  "languageRules": {
    "name": "Python",
    "minVersion": "3.7.5",
    "detailsUrl": "https://github.com/aws/aws-graviton-getting-started/blob/main/python.md"
  },
  "libraryRules": [
    {
      "name": "NumPy",
      "minVersion": "1.19.0",
      "recommendedVersion": "1.21.1"
    }
  ]
}
```

### Integration Approach

The transformation downloads the latest compatibility rules during execution and integrates them with AI-powered analysis to provide:

1. **Accurate Compatibility Assessment**: Based on proven compatibility data
2. **Version-Specific Recommendations**: Exact minimum versions for ARM64 support
3. **Risk Classification**: Known issues categorized by complexity and effort
4. **Migration Guidance**: Specific steps based on detected patterns

This approach combines the proven accuracy of static analysis tools with the comprehensive understanding and strategic planning capabilities of AI-powered transformation.