#import "NotificationViewController.h"

@interface NotificationViewController ()
@end

@implementation NotificationViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    // DEBUGGING: Check if IBOutlets are connected
    NSLog(@"========================================");
    NSLog(@"[NCE] viewDidLoad called!");
    NSLog(@"[NCE] titleLabel: %@", self.titleLabel ? @"CONNECTED" : @"NIL!!!");
    NSLog(@"[NCE] bodyLabel: %@", self.bodyLabel ? @"CONNECTED" : @"NIL!!!");
    NSLog(@"[NCE] imageView: %@", self.attachmentImageView ? @"CONNECTED" : @"NIL!!!");
    NSLog(@"========================================");

    // Configure view styling - BRIGHT PINK FOR TESTING
    self.view.backgroundColor = [UIColor colorWithRed:1.0 green:0.0 blue:1.0 alpha:1.0]; // Bright magenta

    // If outlets are nil, create labels manually as a fallback
    if (!self.titleLabel) {
        NSLog(@"[NCE] WARNING: titleLabel outlet not connected! Creating manually...");
        UILabel *label = [[UILabel alloc] initWithFrame:CGRectMake(16, 16, self.view.bounds.size.width - 32, 50)];
        label.text = @"MANUAL TITLE";
        label.font = [UIFont boldSystemFontOfSize:30];
        label.textColor = [UIColor yellowColor];
        label.numberOfLines = 0;
        [self.view addSubview:label];
    } else {
        // Configure title label styling
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

    // Set title (force color on every notification)
    if (self.titleLabel) {
        self.titleLabel.text = content.title ?: @"";
        self.titleLabel.textColor = [UIColor colorWithRed:1.0 green:0.0 blue:1.0 alpha:1.0]; // BRIGHT MAGENTA FOR TESTING
        self.titleLabel.font = [UIFont boldSystemFontOfSize:30]; // HUGE font for testing
    }

    // Set body (force color on every notification)
    if (self.bodyLabel) {
        self.bodyLabel.text = content.body ?: @"";
        self.bodyLabel.textColor = [UIColor colorWithRed:0.0 green:0.47843137250000001 blue:1.0 alpha:1.0]; // Blue
        self.bodyLabel.font = [UIFont systemFontOfSize:15];
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
