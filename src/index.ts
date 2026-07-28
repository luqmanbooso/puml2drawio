import fs from 'node:fs';
import path from 'node:path';
import { parsePuml } from './parser/parsePuml';
import { calculateLayout } from './layout/calculateLayout';
import { buildMxGraph } from './builder/buildMxGraph';
import { ThemeName } from './themes/themeManager';

const samplePuml = `
@startuml
class "User" as User {
  +id: Long
  +name: String
  +email: String
  +login(): void
}

class "Customer" as Customer {
  +shippingAddress: String
  +checkout(): void
}

class "Order" as Order {
  +id: Long
  +orderDate: Date
  +totalAmount: double
  +calculateTotal(): double
}

class "OrderItem" as Item {
  +quantity: int
  +price: double
}

class "Product" as Product {
  +sku: String
  +title: String
  +price: double
  +updateStock(qty: int): void
}

enum "OrderStatus" as Status {
  PENDING
  SHIPPED
  DELIVERED
}

User <|-- Customer
Customer "1" -- "0..*" Order : places
Order "1" *-- "1..*" Item : contains
Item "*" -- "1" Product : references
Order ..> Status : uses
@enduml
`;

// Try changing theme to 'dracula', 'aws', 'nord', 'monochrome', or 'classic'
const SELECTED_THEME: ThemeName = 'monochrome';

console.log(`🚀 Running PlantUML -> Draw.io Converter (Theme: ${SELECTED_THEME})...\n`);

const parsedGraph = parsePuml(samplePuml);
const layoutGraph = calculateLayout(parsedGraph);
const xmlOutput = buildMxGraph(layoutGraph, { theme: SELECTED_THEME });

const outputPath = path.join(__dirname, '../output.drawio');
fs.writeFileSync(outputPath, xmlOutput, 'utf8');

console.log(`✅ Success! Diagram generated with [${SELECTED_THEME}] theme at: ${outputPath}`);