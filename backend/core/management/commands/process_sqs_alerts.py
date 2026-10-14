
from django.core.management.base import BaseCommand, CommandError

from core.sqs_service import process_sqs_messages


class Command(BaseCommand):
    help = "Process CloudWatch alarm notifications from the SQS queue"

    def handle(self, *args, **options):
        try:
            result = process_sqs_messages(max_messages=5)
        except Exception as exc:
            raise CommandError(
                f"Failed to process SQS alerts: {exc}"
            ) from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"SQS processing completed. "
                f"Messages processed: {result['processed']}."
            )
        )
