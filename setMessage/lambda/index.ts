const { PinpointClient, UpdateCampaignCommand } = require("@aws-sdk/client-pinpoint");

const pinpointClient = new PinpointClient({ region: "ap-northeast-1" });

exports.handler = async (event:any) => {
    const applicationId = "9b74f4a3e06944008aa882015447c15f"; // Your Pinpoint project ID
    const campaignId = "c3d4671fbc6a428b81b392f7b2984dd5"; // Your campaign ID
    const newMessage = event?.message??`このメッセージは　${Date.now()}　にセットされました`; // The new SMS message

    const params = {
        ApplicationId: applicationId,
        CampaignId: campaignId,
        WriteCampaignRequest: {
            MessageConfiguration: {
                SMSMessage: {
                    Body: newMessage
                },
                EmailMessage: {
                    Title: newMessage,
                    Body: newMessage    
                },
                GCMMessage: {
                    Body: newMessage
                },
            }
        }
    };

    try {
        const command = new UpdateCampaignCommand(params);
        const response = await pinpointClient.send(command);
        console.log("Campaign updated successfully:", response);
        return { statusCode: 200, body: JSON.stringify(response) };
    } catch (error) {
        console.error("Error updating campaign:", error);
        return { statusCode: 500, body: JSON.stringify(error) };
    }
};