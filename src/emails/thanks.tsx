import {
    Body,
    Container,
    Head,
    Text,
    Hr,
    Html,
    Link,
    Preview,
} from "@react-email/components";
import * as React from "react";

export const ThanksEmail = () => (
    <Html>
        <Head />
        <Preview>Budgetist</Preview>
        <Body style={main}>
            <Container style={container}>
                <Text style={paragraph}>Thank you for your feedback!</Text>
                <Hr style={hr} />
                <Link href="https://budgetist.vercel.app" style={reportLink}>
                    Budgetist
                </Link>
            </Container>
        </Body>
    </Html>
);

export default ThanksEmail;

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

const paragraph = {
    margin: "0 0 15px",
    fontSize: "15px",
    lineHeight: "1.4",
    color: "#3c4149",
};

const reportLink = {
    fontSize: "14px",
    color: "#b4becc",
};

const hr = {
    borderColor: "#dfe1e4",
    margin: "42px 0 26px",
};

