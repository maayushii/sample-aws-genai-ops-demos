# Document References

This directory contains reference documentation and integration guides for the Graviton Migration Assessment transformation.

## Reference Data Integration

The transformation dynamically downloads and integrates compatibility data from:

- **AWS Porting Advisor for Graviton**: Language-specific compatibility rules and version requirements
- **AWS Graviton Getting Started Guide**: Best practices and optimization recommendations
- **Architecture-Specific Patterns**: x86 to ARM64 migration patterns and intrinsics mapping

## Dynamic Data Sources

During transformation execution, the following reference data is downloaded and integrated:

### Compatibility Rules (`/reference-data/rules/`)
- `python.json` - Python library compatibility matrix
- `java.json` - Java dependency and JNI compatibility
- `go.json` - Go module compatibility requirements
- `node.json` - Node.js native module compatibility
- `ruby.json` - Ruby gem compatibility matrix
- `csharp.json` - .NET package compatibility

### Architecture Constants (`/reference-data/constants/`)
- `intrinsics.py` - x86 vs ARM64 intrinsics mapping
- `arch_specific_libs.py` - Architecture-specific library detection
- `arch_strings.py` - Architecture detection patterns

This approach ensures the transformation always uses the most current compatibility data while maintaining the comprehensive analysis capabilities of AWS Transform.