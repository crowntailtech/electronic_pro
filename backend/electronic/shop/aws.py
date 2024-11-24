'''
    This is a custom library
'''

from decimal import Decimal
import json
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError
from botocore.exceptions import BotoCoreError, ClientError
from electronic.settings import AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_STORAGE_BUCKET_NAME, AWS_REGION_NAME, SNS_TOPIC_ARN, SQS_QUEUE_URL

def upload_to_s3(file_path, object_name):
    """
    Upload a file to an S3 bucket using credentials from Django settings.

    :param file_path: Path to the file to upload
    :param object_name: S3 object name (key)
    :return: URL of the uploaded file or None if failed
    """
    try:
        # Initialize the S3 client with credentials from settings
        s3 = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION_NAME,
        )

        # Upload the file
        s3.upload_file(file_path, AWS_STORAGE_BUCKET_NAME, object_name)

        # Generate the file URL
        file_url = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_REGION_NAME}.amazonaws.com/{object_name}"
        print(f"File uploaded successfully: {file_url}")
        return file_url

    except FileNotFoundError:
        print("The file was not found.")
        return None
    except NoCredentialsError:
        print("AWS credentials not available.")
        return None
    except PartialCredentialsError:
        print("Incomplete AWS credentials configuration.")
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None


def delete_from_s3(object_name, region_name="us-east-1"):
    s3 = boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION_NAME,
    )
    try:
        s3.delete_object(Bucket=AWS_STORAGE_BUCKET_NAME, Key=object_name)
        return True
    except Exception as e:
        print(f"Error deleting file from S3: {e}")
        return False

def subscribe_seller_to_sns(seller_email):
    """
    Subscribe a seller's email to the SNS topic.
    """
    sns_client = boto3.client('sns',
                              aws_access_key_id=AWS_ACCESS_KEY_ID,
                              aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                              region_name=AWS_REGION_NAME
                              )
    topic_arn = SNS_TOPIC_ARN

    try:
        # Create subscription
        response = sns_client.subscribe(
            TopicArn=topic_arn,
            Protocol='email',
            Endpoint=seller_email
        )
        print(f"Subscription successful: {response['SubscriptionArn']}")
        return response['SubscriptionArn']
    except Exception as e:
        print(f"Error subscribing seller: {e}")
        return None


def send_seller_notification(message_body):
    """
    Send a notification to a seller via SQS.
    """
    try:
        # Serialize message body, converting Decimal to float
        def decimal_converter(obj):
            if isinstance(obj, Decimal):
                return float(obj)
            raise TypeError("Object of type %s is not JSON serializable" % type(obj).__name__)

        serialized_message = json.dumps(message_body, default=decimal_converter)

        # Initialize the SQS client
        sqs_client = boto3.client(
            'sqs',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION_NAME,
        )

        # Send the message
        response = sqs_client.send_message(
            QueueUrl=SQS_QUEUE_URL,
            MessageBody=serialized_message,
        )

        print(f"Message sent successfully: {response}")
        return response

    except ClientError as e:
        print(f"ClientError: {e}")
        raise
    except BotoCoreError as e:
        print(f"BotoCoreError: {e}")
        raise
    except Exception as e:
        print(f"Unexpected Error: {e}")
        raise
