import { Fn, Stack, NestedStackProps, CfnOutput} from 'aws-cdk-lib';
import { Construct } from 'constructs/lib/construct';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
// import { RemovalPolicy } from 'aws-cdk-lib/aws-dynamodb';

interface Props extends NestedStackProps {
  tableName: string,
}
 
export class DynamoDBStack extends Stack {

  public readonly RecordsTableName : string;

  constructor(scope: Construct, id: string, prefix: string) {
    super(scope, id);
 

    const table = new dynamodb.Table(this, 'Messages', {
      tableName: `${prefix}RecordsTable`,
      partitionKey: {
        name: 'username',
        type: dynamodb.AttributeType.STRING
      }, 
      sortKey: {
        name: 'logid',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    this.RecordsTableName = table.tableName

    new CfnOutput(this, 'RecordsTableName', { value: table.tableName });



  }
}

