import {
     PinpointClient,
     GetAppsCommand,
     GetAppsCommandInput,
        GetAppsCommandOutput, 
    } from "@aws-sdk/client-pinpoint"; // ES Modules import

const client = new PinpointClient({});

const input :GetAppsCommandInput = { // GetAppsRequest
    PageSize: "1",
    Token : undefined,
};



export const handler = async (event:any) => {
    let continueflg:boolean
    do {
        continueflg = false;
        const response:GetAppsCommandOutput = await client.send(new GetAppsCommand(input));
        if (response?.ApplicationsResponse?.Item) {
            response.ApplicationsResponse.Item.forEach((app: any) => {
                console.log(app);
            });
        }

        if (response.ApplicationsResponse?.NextToken) {
            input.Token = response.ApplicationsResponse.NextToken;
            continueflg = true;
        }
    } while (continueflg);


    return {
        statusCode : 200,
        body : "OK"
    }

}
// { // GetAppsResponse
//   ApplicationsResponse: { // ApplicationsResponse
//     Item: [ // ListOfApplicationResponse
//       { // ApplicationResponse
//         Arn: "STRING_VALUE", // required
//         Id: "STRING_VALUE", // required
//         Name: "STRING_VALUE", // required
//         tags: { // MapOf__string
//           "<keys>": "STRING_VALUE",
//         },
//         CreationDate: "STRING_VALUE",
//       },
//     ],
//     NextToken: "STRING_VALUE",
//   },
// };

