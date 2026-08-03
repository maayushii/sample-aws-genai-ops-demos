# Permission Boundary: Before & After Comparison

**Identity:** AnyCompanyITPortalStack-u-APILambdaServiceRole3EEB9-kPAiNEqhusl0 (role)  
**Analysis Period:** 90 days  
**CloudTrail Events:** 0

> ⚠️ No CloudTrail activity found for this identity in the last 90 days. Boundary is based on granted permissions analysis only.

## Summary

| Metric | Value |
|--------|-------|
| Actions Used (CloudTrail, 90d) | 0 |
| Actions Granted (Current) | 15 |
| Actions in Boundary | 19 |
| **Attack Surface Reduction** | **-26.7%** |

## Granted Permissions (Before)

- `dynamodb:BatchGetItem`
- `dynamodb:BatchWriteItem`
- `dynamodb:ConditionCheckItem`
- `dynamodb:DeleteItem`
- `dynamodb:DescribeTable`
- `dynamodb:GetItem`
- `dynamodb:GetRecords`
- `dynamodb:GetShardIterator`
- `dynamodb:PutItem`
- `dynamodb:Query`
- `dynamodb:Scan`
- `dynamodb:UpdateItem`
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

## Permission Boundary (After)

🔒 **Least-privilege boundary** — only 19 actions:

- ✅ `logs:CreateLogGroup`
- ✅ `logs:CreateLogStream`
- ✅ `logs:PutLogEvents`
- ✅ `logs:DescribeLogGroups`
- ✅ `logs:DescribeLogStreams`
- ✅ `dynamodb:DescribeTable`
- ✅ `dynamodb:GetItem`
- ✅ `dynamodb:PutItem`
- ✅ `dynamodb:UpdateItem`
- ✅ `dynamodb:DeleteItem`
- ✅ `dynamodb:Query`
- ✅ `dynamodb:Scan`
- ✅ `dynamodb:BatchGetItem`
- ✅ `dynamodb:BatchWriteItem`
- ✅ `dynamodb:ConditionCheckItem`
- ✅ `dynamodb:GetRecords`
- ✅ `dynamodb:GetShardIterator`
- ✅ `dynamodb:DescribeTimeToLive`
- ✅ `dynamodb:ListTagsOfResource`

## Permissions Removed

No actions removed — boundary matches current grants.
