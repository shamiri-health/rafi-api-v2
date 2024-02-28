import { Type } from "@sinclair/typebox";

export const UserResponse = Type.Object({
  id: Type.Number(),
  registeredOn: Type.String({ format: "date-time" }),
  alias: Type.Optional(Type.String()),
  dateOfBirth: Type.String({ format: "date" }),
  avatarId: Type.Optional(Type.Number()),
  clientId: Type.Optional(Type.Number()),
  gender2: Type.Optional(Type.String()),
  maritalStatus: Type.Optional(Type.String()),
  organizationalLevel: Type.Optional(Type.String()),
  educationalLevel: Type.Optional(Type.String()),
  profession: Type.Optional(Type.String()),
});

export const ResourceRequest = Type.Object({
  resourceType: Type.Union([
    Type.Literal("subscriptions"),
    Type.Literal("alacarte"),
    Type.Literal("renewal"),
  ]),
  resource_type: Type.Optional(
    Type.Union([
      Type.Literal("subscriptions"),
      Type.Literal("alacarte"),
      Type.Literal("renewal"),
    ]),
  ),
  resource: Type.Union([
    Type.Literal("digitalEvent"),
    Type.Literal("onsiteEvent"),
    Type.Literal("phoneEvent"),
    Type.Literal("groupEvent"),
    Type.Literal("phoneEventIntake"),
  ]),
  resourceId: Type.Number(),
  resource_id: Type.Optional(Type.Number()),
});
