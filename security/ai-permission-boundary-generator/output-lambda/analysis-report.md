# Permission Boundary Analysis Report

**Identity:** AnyCompanyITPortalStack-u-APILambdaServiceRole3EEB9-kPAiNEqhusl0  
**Type:** role  
**Analysis Period:** 90 days  
**Total Events Analyzed:** 0  

## Services Used


## Attached Policies

- **AWSLambdaBasicExecutionRole** (managed)
- **APILambdaServiceRoleDefaultPolicy15BF53F8** (inline)

## Admin Access Detected

✅ No admin access detected

## Recommendations

- No actions were observed in CloudTrail during the analysis window. Consider enforcing a strict zero-action boundary temporarily and monitoring for failures to discover the true minimum required action set before granting any permissions.
- Scope all DynamoDB Resource ARNs to specific table ARNs (e.g., arn:aws:dynamodb:<region>:<account-id>:table/<TableName>) instead of wildcard '*' to prevent lateral movement to unintended tables.
- Scope CloudWatch Logs resources to the specific log group ARN for this Lambda function (e.g., arn:aws:logs:<region>:<account-id>:log-group:/aws/lambda/<FunctionName>:*) to prevent writing to arbitrary log groups.
- Remove dynamodb:Scan from the boundary policy if the application logic does not require full table scans, as this action can be expensive and is often a sign of overly broad data access patterns.
- Enable CloudTrail data events for DynamoDB and S3 and set a 30-day observation window before finalizing this boundary policy, ensuring the granted actions reflect actual runtime behavior rather than anticipated usage.
