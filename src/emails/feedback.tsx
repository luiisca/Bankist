import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import { FeedbackType } from "prisma/zod-utils";

const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "";

export const UserFeedbackEmail = ({ thanksEmail, feedback }: { thanksEmail: string, feedback: FeedbackType & { name: string; email: string } }) => {
    return (
        <Html>
            <Head />
            <Preview>{feedback.comment ?? feedback.rating}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Img
                        src={`${baseUrl}/icon.png`}
                        width="42"
                        height="42"
                        alt="Budgetist"
                        style={logo}
                    />
                    <Heading style={heading}>{feedback.rating}</Heading>
                    <Section style={buttonContainer}>
                        <Button style={button} href={`mailto:${feedback.email}?subject=${encodeURIComponent("User Feedback - Budgetist")}&body=${encodeURIComponent(thanksEmail)}`}>
                            Say thanks!
                        </Button>
                    </Section>
                    <Text style={paragraph}>
                        {feedback.comment}
                    </Text>
                    <Hr style={hr} />
                    <Link href="https://budgetist.vercel.app" style={reportLink}>
                        Budgetist
                    </Link>
                </Container>
            </Body>
        </Html >
    )
};

export default UserFeedbackEmail;

const logo = {
    borderRadius: 21,
    width: 42,
    height: 42,
};

const main = {
    backgroundColor: "#ffffff",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: "0 auto",
    padding: "20px 0 48px",
    maxWidth: "560px",
};

const heading = {
    fontSize: "24px",
    letterSpacing: "-0.5px",
    lineHeight: "1.3",
    fontWeight: "400",
    color: "#484848",
    padding: "17px 0 0",
};

const paragraph = {
    margin: "0 0 15px",
    fontSize: "15px",
    lineHeight: "1.4",
    color: "#3c4149",
};

const buttonContainer = {
    padding: "27px 0 27px",
};

const button = {
    backgroundColor: "#5e6ad2",
    borderRadius: "3px",
    fontWeight: "600",
    color: "#fff",
    fontSize: "15px",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "11px 23px",
};

const reportLink = {
    fontSize: "14px",
    color: "#b4becc",
};

const hr = {
    borderColor: "#dfe1e4",
    margin: "42px 0 26px",
};

