import { PinpointClient, CreateExportJobCommand, GetExportJobCommand ,GetExportJobCommandInput,GetExportJobCommandOutput} from "@aws-sdk/client-pinpoint";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { Readable } from 'stream';

const pinpointClient = new PinpointClient({ region: "ap-northeast-1" });
const s3Client = new S3Client({ region: "ap-northeast-1" });


interface EndpointRequired {
    ChannelType: string;
    Address: string;
    UserId: string;
}
interface Endpoint extends EndpointRequired { }

exports.handler = async (event: APIGatewayEvent,context:Context):Promise<APIGatewayProxyResult> => {
    const applicationId = process.env.PINPOINT_APPLICATION_ID;
    const s3BucketName = process.env.S3_BUCKET_NAME;
    const s3KeyPrefix = 'Exports/';
    const iamRoleArn = process.env.EXPORT_ROLE_ARN;
    const MkEndpointHtmlStacks3Key = `pinpoint-endpoints-${Date.now()}.html`;


    console.log('DEB DEB ★★ ', `applicationid ${applicationId} s3BucketName ${s3BucketName} `);

    //try {
        // Step 1: Create an export job
        // Create export job
        const createExportJobCommand = new CreateExportJobCommand({
            ApplicationId: applicationId,
            ExportJobRequest: {
                S3UrlPrefix: `s3://${s3BucketName}/${s3KeyPrefix}`,
                RoleArn: iamRoleArn,
            },
        });
        const createJobResponse = await pinpointClient.send(createExportJobCommand);
        const jobId = createJobResponse.ExportJobResponse?.Id;

        if (!jobId) {
            throw new Error("Failed to create export job");
        }


        console.log('DEB DEB ★★ ', `job id: ${jobId}`);
        // Step 2: Wait for the export job to complete
        let jobCompleted = false;
        while (!jobCompleted) {
            const getJobCommand = new GetExportJobCommand({
                ApplicationId: applicationId,
                JobId: jobId,
            });
            const jobStatus:GetExportJobCommandOutput = await pinpointClient.send(getJobCommand);

            if (jobStatus.ExportJobResponse?.JobStatus === "COMPLETED") {
                console.log('JBSTATUS=',JSON.stringify(jobStatus, null, 2));
                jobCompleted = true;
            } else if (jobStatus.ExportJobResponse?.JobStatus === "FAILED") {
                throw new Error("Export job failed");
            } else {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before checking again
            }
        }
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html',
            },
            body: 'OK',
        };
/*
        // Step 3: Read the exported file from S3
         // Retrieve exported data
         if (!s3BucketName || !s3Key) {
            throw new Error("Missing required environment variables");
        }
    
        try {
            const getObjectCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: s3Key,
            });
    
            const response = await s3Client.send(getObjectCommand);
            const csvData = await response.Body?.transformToString();
    
            if (!csvData) {
                throw new Error("Failed to retrieve CSV data");
            }
    
            const records = parse(csvData, { columns: true });
    
            const htmlTable = generateHtmlTable(records);
    
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/html',
                },
                body: htmlTable,
            };
        } catch (error) {
            console.error('Error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Internal server error' }),
            };
        }

*/

   /* } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    } */
};
function generateHtmlTable(records: any[]): string {
    const headers = Object.keys(records[0]);
    const rows = records.map(record => 
        `<tr>${headers.map(header => `<td>${record[header]}</td>`).join('')}</tr>`
    ).join('');

    return `
        <table border="1">
            <thead>
                <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}