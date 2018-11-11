export interface TemplateVisitorIr {
  templates: TemplateIr[];
}

export interface TemplateIr {
  templateName: string;
  variables: string[];
  query: string;
}

export interface TemplateVariableAssignments {
  variable: string;
  assignment: string;
}

// export interface WhereIr {

// }

// export interface SelectIr {
//   type: RelationType;
//   where: WhereIr[]
// }

export type TemplateExpressionValue = string | TemplateIr | TemplateVariableAssignments;