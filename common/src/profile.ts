/** Customer profile stored at `pk=USER#<cognitoSub>`, `sk=PROFILE` (plus key attrs in Dynamo). */
export interface UserProfileDto {
  readonly userId: string;
  readonly fullName: string;
  readonly phone: string;
  readonly deliveryAddress: string;
  readonly allergies: readonly string[];
  readonly note?: string;
  readonly updatedAt: string;
}
