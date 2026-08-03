# Permission Boundary: Before & After Comparison

**Identity:** DevOpsAgentRole-WebappAdmin (role)  
**Analysis Period:** 90 days  
**CloudTrail Events:** 0

> ⚠️ No CloudTrail activity found for this identity in the last 90 days. Boundary is based on granted permissions analysis only.

## Summary

| Metric | Value |
|--------|-------|
| Actions Used (CloudTrail, 90d) | 0 |
| Actions Granted (Current) | 61 |
| Actions in Boundary | 50 |
| **Attack Surface Reduction** | **18.0%** |

## Granted Permissions (Before)

- `aidevops:CreateAccessToken`
- `aidevops:CreateAsset`
- `aidevops:CreateAssetFile`
- `aidevops:CreateBacklogTask`
- `aidevops:CreateChat`
- `aidevops:CreateKnowledgeItem`
- `aidevops:CreateTrigger`
- `aidevops:DeleteAsset`
- `aidevops:DeleteAssetFile`
- `aidevops:DeleteKnowledgeItem`
- `aidevops:DeleteTrigger`
- `aidevops:DescribeServices`
- `aidevops:DescribeSupportLevel`
- `aidevops:DiscoverTopology`
- `aidevops:EndChatForCase`
- `aidevops:GetAccessToken`
- `aidevops:GetAccountUsage`
- `aidevops:GetAgentSpace`
- `aidevops:GetAsset`
- `aidevops:GetAssetContent`
- `aidevops:GetAssetFile`
- `aidevops:GetAssociation`
- `aidevops:GetBacklogTask`
- `aidevops:GetKnowledgeItem`
- `aidevops:GetRecommendation`
- `aidevops:GetTrigger`
- `aidevops:InitiateChatForCase`
- `aidevops:ListAccessTokens`
- `aidevops:ListAssetFiles`
- `aidevops:ListAssetTypes`
- `aidevops:ListAssetVersions`
- `aidevops:ListAssets`
- `aidevops:ListAssociations`
- `aidevops:ListBacklogTasks`
- `aidevops:ListChats`
- `aidevops:ListExecutions`
- `aidevops:ListGoals`
- `aidevops:ListJournalRecords`
- `aidevops:ListKnowledgeItemVersions`
- `aidevops:ListKnowledgeItems`
- `aidevops:ListPendingMessages`
- `aidevops:ListRecommendations`
- `aidevops:ListTriggers`
- `aidevops:RevokeAccessToken`
- `aidevops:RotateAccessToken`
- `aidevops:SendMessage`
- `aidevops:UpdateApprovalAction`
- `aidevops:UpdateAsset`
- `aidevops:UpdateAssetFile`
- `aidevops:UpdateBacklogTask`
- `aidevops:UpdateGoal`
- `aidevops:UpdateKnowledgeItem`
- `aidevops:UpdateRecommendation`
- `aidevops:UpdateTrigger`
- `secretsmanager:CreateSecret`
- `secretsmanager:ListSecrets`
- `support:DescribeCases`
- `support:DescribeServices`
- `support:DescribeSupportLevel`
- `support:InitiateChatForCase`
- `transcribe:StartStreamTranscriptionWebSocket`

## Permission Boundary (After)

🔒 **Least-privilege boundary** — only 50 actions:

- ✅ `aidevops:GetAgentSpace`
- ✅ `aidevops:GetAccountUsage`
- ✅ `aidevops:DescribeServices`
- ✅ `aidevops:DescribeSupportLevel`
- ✅ `aidevops:ListAssets`
- ✅ `aidevops:ListAssetTypes`
- ✅ `aidevops:ListAssetVersions`
- ✅ `aidevops:ListAssetFiles`
- ✅ `aidevops:ListAssociations`
- ✅ `aidevops:ListBacklogTasks`
- ✅ `aidevops:ListChats`
- ✅ `aidevops:ListExecutions`
- ✅ `aidevops:ListGoals`
- ✅ `aidevops:ListJournalRecords`
- ✅ `aidevops:ListKnowledgeItems`
- ✅ `aidevops:ListKnowledgeItemVersions`
- ✅ `aidevops:ListRecommendations`
- ✅ `aidevops:ListTriggers`
- ✅ `aidevops:ListPendingMessages`
- ✅ `aidevops:ListAccessTokens`
- ✅ `aidevops:GetAsset`
- ✅ `aidevops:GetAssetContent`
- ✅ `aidevops:GetAssetFile`
- ✅ `aidevops:GetAssociation`
- ✅ `aidevops:GetBacklogTask`
- ✅ `aidevops:GetKnowledgeItem`
- ✅ `aidevops:GetRecommendation`
- ✅ `aidevops:GetTrigger`
- ✅ `aidevops:GetAccessToken`
- ✅ `aidevops:DiscoverTopology`
- ✅ `support:DescribeCases`
- ✅ `support:DescribeServices`
- ✅ `support:DescribeSupportLevel`
- ✅ `secretsmanager:ListSecrets`
- ✅ `aidevops:CreateAccessToken`
- ✅ `aidevops:RevokeAccessToken`
- ✅ `aidevops:RotateAccessToken`
- ✅ `aidevops:DeleteAsset`
- ✅ `aidevops:DeleteAssetFile`
- ✅ `aidevops:DeleteKnowledgeItem`
- ✅ `aidevops:DeleteTrigger`
- ✅ `aidevops:CreateTrigger`
- ✅ `aidevops:UpdateTrigger`
- ✅ `aidevops:InitiateChatForCase`
- ✅ `aidevops:EndChatForCase`
- ✅ `aidevops:SendMessage`
- ✅ `aidevops:UpdateApprovalAction`
- ✅ `secretsmanager:CreateSecret`
- ✅ `support:InitiateChatForCase`
- ✅ `transcribe:StartStreamTranscriptionWebSocket`

## Permissions Removed

**11 actions removed:**

- ❌ ~~`aidevops:CreateAsset`~~
- ❌ ~~`aidevops:CreateAssetFile`~~
- ❌ ~~`aidevops:CreateBacklogTask`~~
- ❌ ~~`aidevops:CreateChat`~~
- ❌ ~~`aidevops:CreateKnowledgeItem`~~
- ❌ ~~`aidevops:UpdateAsset`~~
- ❌ ~~`aidevops:UpdateAssetFile`~~
- ❌ ~~`aidevops:UpdateBacklogTask`~~
- ❌ ~~`aidevops:UpdateGoal`~~
- ❌ ~~`aidevops:UpdateKnowledgeItem`~~
- ❌ ~~`aidevops:UpdateRecommendation`~~
