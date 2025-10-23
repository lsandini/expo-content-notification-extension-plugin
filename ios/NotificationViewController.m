#import "NotificationViewController.h"

@interface NotificationViewController ()
@end

@implementation NotificationViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    // Image view corner radius (not available in storyboard for iOS 13)
    if (self.attachmentImageView) {
        self.attachmentImageView.layer.cornerRadius = 8.0;
    }
}

- (void)didReceiveNotification:(UNNotification *)notification {
    // Get notification content
    UNNotificationContent *content = notification.request.content;

    // Set text content (styling comes from storyboard)
    if (self.titleLabel) {
        self.titleLabel.text = content.title ?: @"";
    }

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
