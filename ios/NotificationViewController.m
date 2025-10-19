#import "NotificationViewController.h"

@interface NotificationViewController ()
@end

@implementation NotificationViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    // Configure view styling
    self.view.backgroundColor = [UIColor colorWithRed:0.95 green:0.95 blue:0.95 alpha:1.0];

    // Configure title label styling
    if (self.titleLabel) {
        self.titleLabel.font = [UIFont boldSystemFontOfSize:17];
        self.titleLabel.textColor = [UIColor colorWithRed:1.0 green:0.23137254900000001 blue:0.18823529410000001 alpha:1.0]; // Red
        self.titleLabel.numberOfLines = 0;
    }

    // Configure body label styling
    if (self.bodyLabel) {
        self.bodyLabel.font = [UIFont systemFontOfSize:15];
        self.bodyLabel.textColor = [UIColor colorWithRed:0.0 green:0.47843137250000001 blue:1.0 alpha:1.0]; // Blue
        self.bodyLabel.numberOfLines = 0;
    }

    // Configure image view styling
    if (self.attachmentImageView) {
        self.attachmentImageView.contentMode = UIViewContentModeScaleAspectFit;
        self.attachmentImageView.clipsToBounds = YES;
        self.attachmentImageView.layer.cornerRadius = 8.0;
    }
}

- (void)didReceiveNotification:(UNNotification *)notification {
    // Get notification content
    UNNotificationContent *content = notification.request.content;

    // Set title
    if (self.titleLabel) {
        self.titleLabel.text = content.title ?: @"";
    }

    // Set body
    if (self.bodyLabel) {
        self.bodyLabel.text = content.body ?: @"";
    }

    // Handle image attachment
    if (self.attachmentImageView && content.attachments.count > 0) {
        UNNotificationAttachment *attachment = content.attachments.firstObject;

        if ([attachment.URL startAccessingSecurityScopedResource]) {
            UIImage *image = [UIImage imageWithContentsOfFile:attachment.URL.path];
            if (image) {
                self.attachmentImageView.image = image;
                self.attachmentImageView.hidden = NO;
            } else {
                self.attachmentImageView.hidden = YES;
            }
            [attachment.URL stopAccessingSecurityScopedResource];
        }
    } else {
        // Hide image view if no attachment
        if (self.attachmentImageView) {
            self.attachmentImageView.hidden = YES;
        }
    }
}

@end
