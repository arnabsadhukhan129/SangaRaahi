import {CommunityType} from "../enums/common.enums";
import {AddressDetails, CommunityMember, OwnerDetails} from "../typedefs/custom.types";

export interface Community {
  id: String,
  ownerId: String,
  communityType:CommunityType,
  bannerImage:String,
  communityName:String,
  communityDescription: String,
  communityLocation:String,
  address:AddressDetails,
  nonProfit?:Boolean,
  nonProfitTaxId?:String,
  members?:[CommunityMember],
  isActive?:Boolean,
  isDeleted?:Boolean,
  expiredAt?:String,
  createdAt?:String,
  updatedAt?:String
  ownerDetails?:OwnerDetails
}
