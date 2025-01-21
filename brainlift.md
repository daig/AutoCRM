# AutoCRM – Brain Lift

## 1. Purpose
AutoCRM is a robust Customer Relationship Management (CRM) application that merges modern web technologies and thoughtful architectural decisions to provide a scalable, maintainable, and user-friendly system. Key features and objectives include:

- **Robust Backend**: Built on Supabase and PostgreSQL, leveraging advanced database features like enumerated types, partial indexes, triggers, and stored procedures.
- **Modern Frontend**: Uses React, TypeScript, and Chakra UI to deliver a responsive, accessible user interface with efficient state management and routing.
- **Infrastructure as Code**: Managed by Terraform with AWS Amplify integration for continuous deployment and environment consistency.
- **Security and UX**: Strong emphasis on data integrity, authentication, and a seamless real-time user experience.

### Scope
- **In Scope**: 
  - CRM functionality (tickets, tags, metadata fields)
  - Real-time data updates via Supabase
  - Infrastructure as Code via Terraform
  - Secure user authentication and authorization
- **Out of Scope**: 
  - Third-party integrations beyond Supabase/AWS Amplify
  - Advanced analytics/dashboarding
  - Multi-tenant resource isolation

---

## 2. Experts

### PostgreSQL / Supabase Team
- **Who**: Core PostgreSQL contributors and Supabase team  
- **Focus**: Advanced schema design, triggers, stored procedures, real-time APIs  
- **Why Follow**: Guidance on leveraging PostgreSQL’s robust feature set and Supabase’s open-source ecosystem for real-time CRUD operations.  
- **Where**:  
  - [PostgreSQL Docs](https://www.postgresql.org/docs/)  
  - [Supabase Docs](https://supabase.com/docs)

### React and TypeScript Community
- **Who**: React core team, TypeScript maintainers, and community experts  
- **Focus**: Building modular, type-safe SPAs and shared component libraries  
- **Why Follow**: Provides best practices for architecting large, maintainable React apps with static typing and hooks.  
- **Where**:  
  - [React Documentation](https://react.dev/)  
  - [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Chakra UI Team
- **Who**: Chakra UI maintainers and contributors  
- **Focus**: Accessible, modular, and themeable React component library  
- **Why Follow**: Ensures a consistent UI design system while simplifying responsive and accessible layout creation.  
- **Where**:  
  - [Chakra UI Docs](https://chakra-ui.com/docs)

### Terraform and HashiCorp
- **Who**: Terraform development team at HashiCorp  
- **Focus**: Infrastructure as Code (IaC) best practices, modules, and state management  
- **Why Follow**: Ensures stable, version-controlled infrastructure configurations that scale with the project.  
- **Where**:  
  - [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)

### AWS Amplify Team
- **Who**: AWS Amplify product team and community  
- **Focus**: Streamlined CI/CD pipelines, hosting, and integrated backend services  
- **Why Follow**: Automates deployments for full-stack apps with minimal setup, ensuring quick iteration and stable production releases.  
- **Where**:  
  - [AWS Amplify Docs](https://docs.amplify.aws/)

---

## 3. SpikyPOVs

### Truths
- **Centralizing business logic in PostgreSQL** via triggers and functions ensures consistent data integrity without duplicating validation logic across multiple layers.  
- **Using React + TypeScript** improves maintainability and reduces runtime errors, crucial for a growing CRM codebase.  
- **Chakra UI’s approach** to design and accessibility accelerates UI development while keeping the UX consistent and inclusive.  
- **Infrastructure as Code with Terraform** provides reproducible, version-controlled environments that simplify scaling and maintenance.

### Myths
- **“Storing logic in stored procedures is outdated.”** In reality, well-structured triggers and functions can significantly reduce application-layer complexity and guarantee data consistency.  
- **“You must have Redux for complex CRM state.”** Supabase real-time subscriptions and React’s Context/Hooks can handle most state needs without additional overhead.  
- **“IaC is too big of a lift for smaller projects.”** Terraform’s modular approach actually speeds up development and reduces misconfiguration risks, even for smaller teams.  
- **“AWS Amplify is only for small side projects.”** With proper Terraform configurations, Amplify can reliably support staging/production environments at scale.

---

## 4. Knowledge Tree

### Technical Architecture
#### Summary
- **Backend**: 
  - **Database**: Supabase (PostgreSQL) with enumerated types, triggers, stored procedures, partial indexes  
  - **Business Logic**: Centralized in triggers and functions for tag validation, metadata enforcement, and automatic timestamp management
- **Frontend**: 
  - **Framework**: React + TypeScript for type-safety and modular design  
  - **UI Library**: Chakra UI for a consistent, accessible design system  
  - **State Management & Routing**: React Router, Context API, and Supabase real-time client
- **Infrastructure**: 
  - **IaC**: Terraform for provisioning AWS resources  
  - **Deployment**: AWS Amplify for continuous integration and hosting  
- **Security**: 
  - **Authentication**: Protected routes, user contexts, and DB-level constraints  
  - **Secrets Management**: Terraform variables for Supabase keys, GitHub tokens, etc.

#### Sources

##### PostgreSQL / Supabase Documentation
- **Summary**: Covers advanced schema design with enumerated types, partial indexes, and real-time APIs.  
- **Link**: [Supabase Docs](https://supabase.com/docs)  
- **Insights**:  
  - Encouraged the use of triggers to reduce validation duplication.  
  - Showed how to implement partial indexes for performance gains.

##### React & TypeScript Documentation
- **Summary**: Introduces best practices for building large SPAs with typed components and hooks.  
- **Link**:  
  - [React Docs](https://react.dev/)  
  - [TypeScript Handbook](https://www.typescriptlang.org/docs/)  
- **Insights**:  
  - Reinforced the value of TypeScript for scalability.  
  - Helped adopt modern React features like hooks and Context for state management.

##### Chakra UI Documentation
- **Summary**: Provides a theming system and accessible components for React.  
- **Link**: [Chakra UI Docs](https://chakra-ui.com/docs)  
- **Insights**:  
  - Helped rapidly develop an accessible, responsive interface.  
  - Standardized design tokens (colors, spacing, typography) for a consistent look.

##### Terraform by HashiCorp
- **Summary**: Guides on defining AWS infrastructure declaratively.  
- **Link**: [Terraform Docs](https://developer.hashicorp.com/terraform/docs)  
- **Insights**:  
  - Demonstrated best practices for state management and environment isolation.  
  - Enabled version-controlled infrastructure changes and rollbacks.

##### AWS Amplify Documentation
- **Summary**: Explains end-to-end deployment, hosting, and CI/CD workflows for full-stack apps.  
- **Link**: [AWS Amplify Docs](https://docs.amplify.aws/)  
- **Insights**:  
  - Provided a quick path to continuous integration with minimal manual setup.  
  - Allowed custom routing rules for seamless SPA deployment.

---

> **By consolidating architectural choices, expert references, and pivotal truths/myths, this “brain lift” document serves as both a high-level guide and a living reference for AutoCRM’s ongoing development and scaling.**