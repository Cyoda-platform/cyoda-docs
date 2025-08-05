# Provisioning your first Cyoda Cloud Environment

Getting your first Cyoda Cloud Free Tier environment is very straightforward. Simply follow the steps below.

## TL;DR

> [!INFO] Provisioning your first Cyoda Cloud Environment
> 1. Create an account on [https://ai.cyoda.net](https://ai.cyoda.net)
> 2. Deploy an environment by prompting the AI Assistant with: `Please deploy my Cyoda environment`
> 3. Create a technical user by prompting the AI Assistant with: `Please create a technical user for my environment`
> 4. Access your environment via the Cyoda UI or APIs

## Create an Account

1. **Access the AI Assistant**: Navigate to the Cyoda Cloud web-based Single Page Application (SPA) at [https://ai.cyoda.net](https://ai.cyoda.net) and consent to the terms and conditions.

![AI Assistant Consent](./images/env-provisioning-flow/01-ai-assistant-consent.png)

![AI Assistant Greeting Screen](./images/env-provisioning-flow/02-ai-assistant-greet.png)

2. **Choose Authentication Provider**: Register using one of the supported providers:
    - **Google Auth**: Sign up using your Google account
    - **GitHub**: Sign up using your GitHub account
3. **Complete Registration**: Follow the Auth0 authentication flow to complete your account setup
4. **Free Tier Access**: Upon successful registration, you'll be automatically enrolled in the Free Tier subscription

## Deploy an Environment

Prompt the AI Assistant with: `Please deploy my Cyoda environment`. Wait a bit. Then confirm the deployment if requested.

![Deploy Env Prompt](./images/env-provisioning-flow/03-deploy-env-prompt.png)


**Save your Environment URL**: The AI Assistant will provide you with your environment URL. Write it down, you'll need it to access your environment.

Wait for the deployment to complete.

![Deploy Env Prompt](./images/env-provisioning-flow/04-env-deployed-confirmation.png)

## Create a Technical User

**Create a technical user (M2M client)**: Prompt the AI Assistant with: "Please create a technical user for my environment". You will see a button to launch the query against your env to create a new user. Write down the client ID and secret - you'll need them to access your environment.

![Create Technical User Prompt](./images/env-provisioning-flow/05-create-technical-user.png)


## Access the Environment
Once your environment is deployed and you have a technical user, you can access your environment.

### Via the Cyoda UI

Just navigate to your environment URL in your favorite browser at `https://client-<your_caas_user_id>.eu.cyoda.net` 
You can find your environment URL from the previous steps or ask the AI Assistant for the url

![Login Cyoda UI](./images/env-provisioning-flow/06-login-cyoda-ui.png)

With the Cyoda UI you need to login with your personal via Auth0.

![Cyoda UI](./images/env-provisioning-flow/07-logged-in.png)

### Via the API
To access the APIs you need to use your technical user credentials to authenticate.
See also [Authentication & Authorization](authentication-authorization.md) for more details
