import { PinpointClient, CreateImportJobCommand } from "@aws-sdk/client-pinpoint"; // ES Modules import
// const { PinpointClient, CreateImportJobCommand } = require("@aws-sdk/client-pinpoint"); // CommonJS import
/*
const client = new PinpointClient({});
const input = { // CreateImportJobRequest
  ApplicationId: "STRING_VALUE", // required
  ImportJobRequest: { // ImportJobRequest
    DefineSegment: true || false,
    ExternalId: "STRING_VALUE",
    Format: "CSV" || "JSON", // required
    RegisterEndpoints: true || false,
    RoleArn: "STRING_VALUE", // required
    S3Url: "STRING_VALUE", // required
    SegmentId: "STRING_VALUE",
    SegmentName: "STRING_VALUE",
  },
};
const command = new CreateImportJobCommand(input);
const response = await client.send(command);
// { // CreateImportJobResponse
//   ImportJobResponse: { // ImportJobResponse
//     ApplicationId: "STRING_VALUE", // required
//     CompletedPieces: Number("int"),
//     CompletionDate: "STRING_VALUE",
//     CreationDate: "STRING_VALUE", // required
//     Definition: { // ImportJobResource
//       DefineSegment: true || false,
//       ExternalId: "STRING_VALUE",
//       Format: "CSV" || "JSON", // required
//       RegisterEndpoints: true || false,
//       RoleArn: "STRING_VALUE", // required
//       S3Url: "STRING_VALUE", // required
//       SegmentId: "STRING_VALUE",
//       SegmentName: "STRING_VALUE",
//     },
//     FailedPieces: Number("int"),
//     Failures: [ // ListOf__string
//       "STRING_VALUE",
//     ],
//     Id: "STRING_VALUE", // required
//     JobStatus: "CREATED" || "PREPARING_FOR_INITIALIZATION" || "INITIALIZING" || "PROCESSING" || "PENDING_JOB" || "COMPLETING" || "COMPLETED" || "FAILING" || "FAILED", // required
//     TotalFailures: Number("int"),
//     TotalPieces: Number("int"),
//     TotalProcessed: Number("int"),
//     Type: "STRING_VALUE", // required
//   },
// };

*/