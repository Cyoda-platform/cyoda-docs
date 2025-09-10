---
title: "SQL and Trino"
description: How to query Cyoda entity data with SQL
sidebar:
  order: 6
---

## Step 1: Create a SQL Schema

### Using the Cyoda UI

It is very straightforward to create a SQL schema in the Cyoda UI. Once logged in you can 
create and configure new Schemas, or edit existing ones. Just navigate to the Trino/SQL menu.

### Via the HTTP API

You can also create and manage schemas programmatically using the SQL Schema API endpoints.

### Available API Operations

- **Create default schema**: Generates schema with all entity models and fields
- **Save custom schema**: Create schema with specific table selections
- **List schemas**: Retrieve all available schemas
- **Get schema details**: Fetch specific schema configuration
- **Generate tables**: Create tables from entity model definitions

For complete API endpoint details and request formats, see the [API Documentation](#api).

For authentication details, see [Authentication & Authorization](/guides/authentication-authorization/).

## Step 3: Configure Trino JDBC Client

The JDBC connection string for your environment follows this pattern:
```
jdbc:trino://trino-client-<caas_user_id>.eu.cyoda.net:443/cyoda/<your_schema>
```
where `caas_user_id` is your CAAS user ID and `your_schema` is the schema you created in Step 1.

For authentication credentials and technical user setup, see [Authentication & Authorization](/guides/authentication-authorization#technical-user-creation).

## Step 4: Verify Schema

Once connected via JDBC, we recommend that you verify your schema configuration by running the following SQL to see all schemas:

```sql
SHOW SCHEMAS;
```

Or list tables in your schema:

```sql
SHOW TABLES FROM your_schema;
```

You should now see your newly created schema and its tables.