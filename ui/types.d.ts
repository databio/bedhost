/// These are types for which we can not auto-gen because they are not represented in the OpenAPI schema.

export interface ServiceInfoResponse {
  id: string;
  name: string;
  type: ServiceType;
  description: string;
  organization: Organization;
  contactUrl: string;
  documentationUrl: string;
  updatedAt: string;
  environment: string;
  version: string;
  component_versions: ComponentVersions;
}

export interface ServiceType {
  group: string;
  artifact: string;
  version: string;
}

export interface Organization {
  name: string;
  url: string;
}

export interface ComponentVersions {
  bedhost_version: string;
  bbconf_version: string;
  python_version: string;
  openapi_version: string;
}
