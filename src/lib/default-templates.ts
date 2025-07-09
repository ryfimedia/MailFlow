
export const defaultTemplates = [
    {
        name: 'Welcome Email',
        content: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #f9f9f9; padding: 20px; text-align: center;">
        <img src="https://placehold.co/150x50.png" alt="Company Logo" style="max-width: 150px;" data-ai-hint="company logo">
    </div>
    <div style="padding: 20px;">
        <h1 style="font-size: 24px; color: #333;">Welcome, [FirstName]!</h1>
        <p>Thank you for signing up. We're thrilled to have you on board.</p>
        <p>You can expect to receive updates, news, and special offers directly to your inbox. To get started, you can explore our website:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://example.com" style="background-color: #007bff; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit Our Website</a>
        </div>
        <p>If you have any questions, feel free to reply to this email. We're always here to help.</p>
        <p>Best regards,<br>The Team</p>
    </div>
</div>
        `
    },
    {
        name: 'Product Announcement',
        content: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="padding: 20px;">
        <h1 style="font-size: 28px; color: #333; text-align: center;">Introducing Our New Product!</h1>
        <p style="text-align: center; font-size: 18px; color: #555;">The wait is finally over.</p>
        <div style="margin: 20px 0; text-align: center;">
            <img src="https://placehold.co/560x300.png" alt="New Product" style="max-width: 100%; border-radius: 5px;" data-ai-hint="product image">
        </div>
        <p>We are incredibly excited to announce the launch of our latest innovation. It's packed with features designed to make your life easier, including:</p>
        <ul style="padding-left: 20px;">
            <li>Feature A: Does amazing things.</li>
            <li>Feature B: Solves a common problem.</li>
            <li>Feature C: Better than ever before.</li>
        </ul>
        <p>Ready to see it in action? Click the link below to learn more and get yours today.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://example.com" style="background-color: #28a745; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Learn More</a>
        </div>
    </div>
</div>
        `
    },
    {
        name: 'Simple Newsletter',
        content: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #f4f4f4; padding: 20px; border-bottom: 1px solid #ddd;">
        <h1 style="font-size: 24px; margin: 0;">Monthly Newsletter</h1>
        <p style="margin: 5px 0 0;">Your monthly dose of news and updates.</p>
    </div>
    <div style="padding: 20px;">
        <h2 style="font-size: 20px; color: #333;">This Month's Top Story</h2>
        <p>Here's the main highlight of the month. We delve into an interesting topic, providing insights and details that you won't find anywhere else. This section is designed to be engaging and informative.</p>
        <img src="https://placehold.co/560x200.png" alt="Top Story Image" style="max-width: 100%; margin-bottom: 15px; border-radius: 5px;" data-ai-hint="news photo">
        <p>Read the full article on our blog to get all the details.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <h3 style="font-size: 18px; color: #333;">Quick Updates</h3>
        <ul style="padding-left: 20px; margin-top: 10px;">
            <li>Quick update number one. <a href="https://example.com" style="color: #007bff;">Read more...</a></li>
            <li>Another brief news item. <a href="https://example.com" style="color: #007bff;">Read more...</a></li>
            <li>A final short piece of information. <a href="https://example.com" style="color: #007bff;">Read more...</a></li>
        </ul>
    </div>
</div>
        `
    }
];
