<!--
ABOUTME: Quick reference guide providing a concise overview of the most critical caveats, limitations, and gotchas for Cyoda Cloud Free Tier users. For detailed information, see cloud-service-details.md.

THIS PAGE NEEDS TO BE AS COMPACT AND CONCISE AS POSSIBLE, BECAUSE IT IS SHOWN AS A PANEL ON VARIOUS UIs

TONE: Direct, scannable format optimized for quick reference. Focus on the most impactful limitations that users need to be aware of immediately. Use the first-person plural form in the issue descriptions and status, and keep the tone conversational and friendly.
-->

**⚠️ Alpha Phase** - Expect frequent changes and some interruptions.

**🔧 Planned Maintenance**: none at the moment.

| Issue                    | Description                                                                                                                                           | Status                                                                        |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| **Environment Access**   | AI Assistant is currently the only control interface for your environments. **Write down your environment URLs and deployment ID** - don't lose them! | We'll be releasing UI/MCP enhancements shortly!                               |
| **Java Code Generation** | LLM-generated code may not always compile. Usually obvious to fix.                                                                                    | Should get better as we improve our prompts                                   |
| **Auth0 Logouts**        | Unexpected session terminations, possibly related to idle times.                                                                                      | We're only monitoring this at the moment.                                     |
| **Network Outages**      | Occasional connectivity loss between Cloudflare Tunnel and Kubernetes cluster. Few minutes, few times daily.                                          | Working with Hetzner. We might just restructure the internal network routing. |
| **Transactional Deletions** | Deleting large amounts of data is slow, slightly slower than data saves.                                                                              | It's in the backlog, but resolution probably not before end of Alpha Phase.   |

**Reach out to us on [Discord](https://discord.com/invite/95rdAyBZr2) if you need help**.