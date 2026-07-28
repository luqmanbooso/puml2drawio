import fs from 'node:fs';
import path from 'node:path';
import { parsePuml } from './parser/parsePuml';
import { calculateLayout } from './layout/calculateLayout';
import { buildMxGraph } from './builder/buildMxGraph';
import { ThemeName } from './themes/themeManager';

const samplePuml = `
@startuml
class "User" as User {
  +id: String
  +name: String
  +email: String
  +login(): boolean
  +logout(): void
}

class "Student" as Student {
  +studentId: String
  +gpa: double
  +enroll(c: Course): void
}

class "Instructor" as Instructor {
  +employeeId: String
  +title: String
  +createCourse(): Course
}

class "Department" as Department {
  +code: String
  +name: String
}

class "Course" as Course {
  +courseId: String
  +title: String
  +credits: int
  +publish(): void
}

class "Module" as Module {
  +title: String
  +order: int
}

class "Assignment" as Assignment {
  +dueDate: Date
  +maxPoints: double
  +calculateScore(): double
}

class "Submission" as Submission {
  +submittedAt: Date
  +fileUrl: String
  +grade: double
}

enum "CourseStatus" as Status {
  DRAFT
  PUBLISHED
  ARCHIVED
}

class "NotificationService" as NotifService {
  +sendEmail(to: String): void
}

' 1. Inheritance / Generalization (<|--)
User <|-- Student
User <|-- Instructor

' 2. Composition (*--) [Parent controls lifecycle of child]
Course "1" *-- "1..*" Module : contains
Assignment "1" *-- "0..*" Submission : receives

' 3. Aggregation (o--) [Independent lifecycle association]
Department "1" o-- "0..*" Instructor : employs
Department "1" o-- "0..*" Course : offers
Course "0..*" o-- "0..*" Student : enrolledIn

' 4. Directed Association (-->)
Student "1" --> "0..*" Submission : creates

' 5. Dependency (..>)
Instructor ..> NotifService : uses
Course ..> Status : state
@enduml
`;

const SELECTED_THEME: ThemeName = 'classic';

console.log(`🚀 Running PlantUML -> Draw.io Converter (Theme: ${SELECTED_THEME})...\n`);

const parsedGraph = parsePuml(samplePuml);
const layoutGraph = calculateLayout(parsedGraph);
const xmlOutput = buildMxGraph(layoutGraph, { theme: SELECTED_THEME });

const outputPath = path.join(__dirname, '../output.drawio');
fs.writeFileSync(outputPath, xmlOutput, 'utf8');

console.log(`✅ Success! Class Diagram generated at: ${outputPath}`);