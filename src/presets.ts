export interface DiagramPreset {
  id: string;
  name: string;
  code: string;
}

export const DIAGRAM_PRESETS: DiagramPreset[] = [
  {
    id: 'sequence',
    name: 'Sequence Diagram',
    code: `@startuml
autonumber
actor Customer
participant "API Gateway" as API
participant "Auth Service" as Auth
database "User DB" as DB

Customer -> API++ : POST /login
note right of API: Rate limit check

API -> Auth++ : Validate Credentials
Auth -> DB++ : Query User Record
DB --> Auth-- : Return User Payload

alt Valid Credentials
  Auth --> API : JWT Issued
  note over Auth : Log success session
else Invalid Password
  Auth --> API : 401 Unauthorized
  note left of Auth : Alert Security Audit
end

deactivate Auth
API --> Customer-- : Response Output
@enduml`
  },
  {
    id: 'usecase',
    name: 'Use Case Diagram',
    code: `@startuml
left to right direction

actor Customer
actor "Logistics Specialist" as Admin
actor "Payment Gateway" as System

rectangle "Freight & Logistics Portal" {
  usecase "Book Cargo Shipment" as UC_Book
  usecase "Calculate Freight Rates" as UC_Rate
  usecase "Track Container Status" as UC_Track
  usecase "Process Payment" as UC_Pay
  usecase "Generate Bill of Lading" as UC_BOL
  usecase "Request Customs Clearance" as UC_Customs
}

Customer --> UC_Book
Customer --> UC_Track

UC_Book ..> UC_Rate : <<include>>
UC_Book ..> UC_Pay : <<include>>
UC_Book <.. UC_Customs : <<extend>>

UC_Pay --> System
Admin --> UC_BOL
Admin --> UC_Customs
@enduml`
  },
  {
    id: 'state',
    name: 'State Diagram',
    code: `@startuml
[*] --> Pending

state Pending
state Processing
state Shipped
state Delivered
state Cancelled

Pending --> Processing : Payment Approved
Pending --> Cancelled : Payment Failed
Processing --> Shipped : Order Packed
Shipped --> Delivered : Delivered to Customer
Delivered --> [*]
Cancelled --> [*]
@enduml`
  },
  {
    id: 'class',
    name: 'Class Diagram',
    code: `@startuml
class Shipment {
  +String trackingId
  +Double weightKg
  +calculateCost(): Double
}

class Container {
  +String containerNo
  +String sealNo
}

Shipment "1" *-- "1..*" Container : contains
@enduml`
  },
  {
    id: 'er',
    name: 'ER Diagram',
    code: `@startuml
entity Customer {
  * customer_id : varchar [PK]
  --
  name : text
  email : text
}

entity Order {
  * order_id : varchar [PK]
  --
  customer_id : varchar [FK]
  order_date : timestamp
}

Customer ||--o{ Order : places
@enduml`
  },
  {
    id: 'component',
    name: 'Component Diagram',
    code: `@startuml
package "Core Engine" {
  [Parser Module]
  [Layout Engine]
  [DrawIO XML Builder]
}

database "Diagram Cache" as DB

[Parser Module] -> [Layout Engine]
[Layout Engine] -> [DrawIO XML Builder]
[DrawIO XML Builder] --> DB
@enduml`
  },
  {
    id: 'deployment',
    name: 'Deployment Diagram',
    code: `@startuml
node "Client Browser" {
  component "React SPA App"
}

node "Cloud Infrastructure" {
  cloud "Vercel Edge Network" {
    component "CDN Server"
  }
  database "PostgreSQL Database"
}

"React SPA App" --> "CDN Server"
"CDN Server" --> "PostgreSQL Database"
@enduml`
  }
];
