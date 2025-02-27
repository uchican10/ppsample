import { PinpointClient, CreateExportJobCommand, GetExportJobCommand, GetExportJobCommandInput, GetExportJobCommandOutput } from "@aws-sdk/client-pinpoint";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { ListObjectsV2Command, ListObjectsV2CommandInput } from "@aws-sdk/client-s3";
import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { gunzip, unzip } from "zlib";

const pinpointClient = new PinpointClient({ region: "ap-northeast-1" });
const s3Client = new S3Client({ region: "ap-northeast-1" });


interface EndpointRequired {
    ChannelType: string;
    Address: string;
    UserId: string;
}
interface Endpoint extends EndpointRequired { }

exports.handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const applicationId = process.env.PINPOINT_APPLICATION_ID;
    const s3BucketName = process.env.S3_BUCKET_NAME;
    const s3KeyPrefix = 'Exports';
    const iamRoleArn = process.env.EXPORT_ROLE_ARN;
    const MkEndpointHtmlStacks3Key = `pinpoint-endpoints-${Date.now()}.html`;


    if (!s3BucketName) {
        throw new Error("S3_BUCKET_NAME environment variable is not set");
    }


    console.log('DEB DEB ★★ ', `applicationid ${applicationId} s3BucketName ${s3BucketName} `);
    const now: string = nowStr()
    const outPutFolderUrl = `s3://${s3BucketName}/${s3KeyPrefix}/${now}/`

    //try {
    // Step 1: Create an export job
    // Create export job
    // createExportJobで作られるgzファイル名は教えてもらえないため、フォルダ名を決めてそこに入れられたものがこれで作られたものと判断してみる
    const createExportJobCommand = new CreateExportJobCommand({
        ApplicationId: applicationId,
        ExportJobRequest: {
            S3UrlPrefix: outPutFolderUrl,
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
        const jobStatus: GetExportJobCommandOutput = await pinpointClient.send(getJobCommand);

        if (jobStatus.ExportJobResponse?.JobStatus === "COMPLETED") {
            jobCompleted = true;
        } else if (jobStatus.ExportJobResponse?.JobStatus === "FAILED") {
            throw new Error("Export job failed");
        } else {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before checking again
        }
    }

    // get *.gz list on S3UrlPrefix
    const gzFileNames: string[] = await getGzFileName(`${s3BucketName}`, `${s3KeyPrefix}/${now}`)
    console.log('DEB DEB ★★ ', `gzFileNames: ${gzFileNames}`);


    const htmlTable = await getHtmlTableFromS3GzippedCsv(s3BucketName, gzFileNames[0]);
    return {
        statusCode: 200,
        body: htmlTable, //JSON.stringify(JSON.stringify(gzFileNames)) ,
    }


};

// return yyyymmddHMMSS 
function nowStr(): string {
    const currentNow = new Date(Date.now() + ((new Date().getTimezoneOffset() + (9 * 60)) * 60 * 1000));
    return currentNow.toLocaleString('ja-JP', { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(/[/ :]/g, '')
    //    return new Date().toLocaleString('ja-JP',{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"}).replace(/[/ :]/g, '');
}

// 指定フォルダにあるgzファイル名一覧を取得する
async function getGzFileName(s3bucketName: string, s3prefix: string): Promise<string[]> {
    const gzFiles: string[] = [];
    try {
        const params: ListObjectsV2CommandInput = {
            Bucket: s3bucketName,
            Prefix: s3prefix
        };

        let isTruncated = true;
        while (isTruncated) {
            const command = new ListObjectsV2Command(params);
            const response = await s3Client.send(command);

            response.Contents?.forEach((item) => {
                if (item.Key && item.Key.endsWith('.gz')) {
                    gzFiles.push(item.Key);
                }
            });

            isTruncated = response.IsTruncated || false;
            if (isTruncated) {
                params.ContinuationToken = response.NextContinuationToken;
            }
        }

        console.log(`Found ${gzFiles.length} .gz files`);
        return gzFiles;
    } catch (error) {
        console.error("Error listing objects:", error);
        throw error;
    }
}


async function getHtmlTableFromS3GzippedCsv(bucketName: string, key: string): Promise<string> {
    try {
        // Retrieve the gzipped file from S3
        const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
        const response = await s3Client.send(command);

        if (!response.Body) {
            throw new Error("Empty response body");
        }

        // Decompress the gzipped content
        const compressedContent = await response.Body.transformToByteArray();
        const decompressedContent = await new Promise<Buffer>((resolve, reject) => {
            gunzip(compressedContent, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
        /*
        {"ChannelType":"EMAIL","Address":"777777wang.xiulan@example.com","EndpointStatus":"ACTIVE","OptOut":"NONE","Location":{"Country":"CHN"},"Demographic":{"Make":"OnePlus","Platform":"android"},"EffectiveDate":"2025-02-12T11:20:13.627Z","Attributes":{"FavoriteBaseballTeam":["Angels"]},"User":{"UserId":"example-user-id-3"},"ApplicationId":"9b74f4a3e06944008aa882015447c15f","Id":"goy4ne0a7jvyqfcwpj37bf2ajp4","CreationDate":"2025-02-12T11:20:13.627Z"}
        {"ChannelType":"EMAIL","Address":"77777john.stiles@example.com","EndpointStatus":"ACTIVE","OptOut":"NONE","Location":{"Country":"USA"},"Demographic":{"Make":"Apple","Platform":"ios"},"EffectiveDate":"2025-02-12T11:20:13.631Z","Attributes":{"FavoriteBaseballTeam":["Dodgers"]},"User":{"UserId":"example-user-id-2"},"ApplicationId":"9b74f4a3e06944008aa882015447c15f","Id":"xjx1cdh7/jrsbk9horvzbtmiv0c","CreationDate":"2025-02-12T11:20:13.631Z"}
        {"ChannelType":"SMS","Address":"9077462155","EndpointStatus":"ACTIVE","OptOut":"NONE","Location":{"Country":"JPN"},"EffectiveDate":"2025-02-12T11:20:13.630Z","Attributes":{"FavoriteBaseballTeam":["Mariners"]},"User":{"UserId":"ozaoza"},"ApplicationId":"9b74f4a3e06944008aa882015447c15f","Id":"cipw4b7cysdw6q4wk/armvx9uow","CreationDate":"2025-02-12T11:20:13.630Z"}
        {"ChannelType":"SMS","Address":"+818019646515","EndpointStatus":"ACTIVE","OptOut":"NONE","Location":{"City":"Toyama","Country":"JPN"},"EffectiveDate":"2025-02-07T14:29:40.223Z","Attributes":{"FavoriteBaseballTeam":["Carp"],"Birthday":["1987-02-05T00:00:00Z"]},"User":{"UserId":"ozakimotoharu"},"ApplicationId":"9b74f4a3e06944008aa882015447c15f","Id":"hfaecv4ctefgmlg6vpfy6v6t8gu","CreationDate":"2025-02-07T14:29:40.223Z"}
        {"ChannelType":"EMAIL","Address":"xxxxx.example.com","EndpointStatus":"ACTIVE","OptOut":"NONE","Location":{"Country":"JPN"},"Demographic":{"Make":"OnePlus","Platform":"android"},"EffectiveDate":"2025-02-12T11:27:52.948Z","Attributes":{"FavoriteBaseballTeam":["Angels"]},"ApplicationId":"9b74f4a3e06944008aa882015447c15f","Id":"qc32gxt5nrzlrtkzoig6h4b74f8","CreationDate":"2025-02-12T11:27:25.134Z"}
        {"ChannelType":"SMS","Address":"2065550182777777","EndpointStatus":"ACTIVE","OptOut":"NONE","Location":{"Country":"CAN"},"Demographic":{"Make":"LG","Platform":"android"},"EffectiveDate":"2025-02-12T11:20:13.630Z","Attributes":{"FavoriteBaseballTeam":["Blue Jays"]},"User":{"UserId":"example-user-id-1"},"ApplicationId":"9b74f4a3e06944008aa882015447c15f","Id":"q7hwiiyrcs1pi2yym1qlum0+qhy","CreationDate":"2025-02-12T11:20:13.630Z"}
        {"ChannelType":"SMS","Address":"+819077462155","EndpointStatus":"ACTIVE","OptOut":"NONE","Location":{"City":"Toyama","Country":"JPN"},"EffectiveDate":"2025-02-07T14:29:40.220Z","Attributes":{"FavoriteBaseballTeam":["Blue Jays"],"Birthday":["1963-12-07T00:00:00Z"]},"User":{"UserId":"ozakimotoharu"},"ApplicationId":"9b74f4a3e06944008aa882015447c15f","Id":"0f9d1/ssxbcnmownl0tlakemm/m","CreationDate":"2025-02-07T14:29:40.220Z"}
        {"ChannelType":"APNS","Address":"1a2b3c4d5e6f7g8h9i0j1a2b3c4d5e6f7777777","EndpointStatus":"ACTIVE","OptOut":"NONE","Location":{"Country":"USA"},"Demographic":{"Make":"Apple","Platform":"ios"},"EffectiveDate":"2025-02-12T11:20:13.628Z","Attributes":{"FavoriteBaseballTeam":["Mariners"]},"User":{"UserId":"example-user-id-2"},"ApplicationId":"9b74f4a3e06944008aa882015447c15f","Id":"qqwpv9dcsid7280cfke+q8cghug","CreationDate":"2025-02-12T11:20:13.628Z"}
        {"ChannelType":"GCM","Address":"4d5e6f1a2b3c4d5e6f7g8h9i0j1a2b3c77777","EndpointStatus":"ACTIVE","OptOut":"NONE","Location":{"Country":"CHN"},"Demographic":{"Make":"Google","Platform":"android"},"EffectiveDate":"2025-02-12T11:20:13.631Z","Attributes":{"FavoriteBaseballTeam":["Giants"]},"User":{"UserId":"example-user-id-3"},"ApplicationId":"9b74f4a3e06944008aa882015447c15f","Id":"nolc1ypyigmxisqqtdvwllzaut8","CreationDate":"2025-02-12T11:20:13.631Z"}
        */

        // Parse JSON data line by line and flatten objects
        const jsonLines = decompressedContent.toString().split('\n').filter(line => line.trim());
        const flattenedObjects = jsonLines.map(line => flattenObject(JSON.parse(line)));
        const allKeys = Array.from(new Set(flattenedObjects.flatMap(Object.keys))).sort();



        // Create HTML table
        let html = '<table>\n<thead>\n<tr>';
        html += allKeys.map(key => `<th>${key}</th>`).join('');
        html += '</tr>\n</thead>\n<tbody>\n';

        for (const obj of flattenedObjects){
            html += '<tr>';
            html += allKeys.map(key => `<td>${(obj as { [key: string]: any })[key] || ''}</td>`).join('');
            html += '</tr>\n';
        };

        html += '</tbody>\n</table>';

        return new Promise<string>((resolve, reject) => {
            resolve(html);
        }
        );
    } catch (error) {
        console.error("Error processing S3 object:", error);
        throw error;
    }
}


// Flatten the keys of an object
const flattenObject = (obj: any, prefix = ''): { [key: string]: string } => {
    return Object.keys(obj).reduce((acc: { [key: string]: string }, k) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object') {
            Object.assign(acc, flattenObject(obj[k], pre + k));
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
};