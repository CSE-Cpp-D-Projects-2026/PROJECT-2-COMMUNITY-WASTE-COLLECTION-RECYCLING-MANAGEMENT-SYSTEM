#include <iostream>
#include <string>
#include <vector>
#include<fstream>
using namespace std;

class Resident{
         public:
        
         int choice,a,b=-1,n;
         int ID[100];
         string R_name[100];
         string Address[100];
         long long contact_no[100];
         string status[100];
         
        Resident(int a) {
            n=a;
         }

        void disp(){
        
        for(int i=0;i<n;i++) {
        cout<<"\n\nEnter the detail of Resident-"<<i+1<<":\n";
        id:
        cout << "\nEnter the Household ID :";
        cin >> ID[i];
        
        for(int j=0;j<i;j++) {
            if(ID[i]==ID[j]) {
                cout<<"Duplicate ID detected"<<endl;
                goto id;
            }
        }

        cout << "Enter the Resident Name :";
        cin.ignore();
        getline(cin, R_name[i]);

        cout << "Enter the Resident Block :";
        cin.ignore();
        getline(cin, Address[i]);

        cout << "Contact no :";
        cin >> contact_no[i];
        status:
        cout << "Service Status(Active / Inactive) :";
        cin >> status[i];
        if(status[i]!="active" && status[i]!="Active" && status[i]!="Inactive" && status[i]!="inactive") {
            cout<<"Invalid status"<<endl;
            goto status;
        }
        }
        
        cout<<"Do you want to perform any of the following operations(1-7):\n";
        cout<<"1.Add\n2.Modify\n3.delete\n4.Search and Display\n5.Activate\n6.Deactivate\n";
        
        cin >> choice;
        if(choice>1 && choice<=6) {
            cout<<"Enter the Household ID of the Resident that You want to Perform the Action:";
            cin>>a;
            for(int j=0;j<n;j++) {
                if(a==ID[j]){
                    b=j;
                }
            }
            if(b==-1) {
                cout<<"Invalid ID--ID not found"<<endl;
            }
        }
if((b>-1 || choice==1) && n>=1 ) {
        switch(choice){

case 1: 

    n++;
    cout<<"\n\nEnter the detail of Resident-"<<n<<":\n";
        cout << "\nEnter the Household ID :";
        cin >> ID[n-1];
        
        for(int j=0;j<n-1;j++) {
            if(ID[n-1]==ID[j] ) {
                cout<<"Duplicate ID detected"<<endl;
                
                cout << "\nEnter the Household_ID :";
                cin >> ID[n-1];
            }
        }

        cout << "Enter the Resident Name :";
        cin.ignore();
        getline(cin, R_name[n-1]);

        cout << "Enter the Resident Block :";
        cin.ignore();
        getline(cin, Address[n-1]);

        cout << "Contact no :";
        cin >> contact_no[n-1];
        stat:
        cout << "Service Status(Active / Inactive) :";
        cin >> status[n-1];
        if(status[n-1]!="active" && status[n-1]!="Active" && status[n-1]!="Inactive" && status[n-1]!="inactive") {
            cout<<"Invalid status"<<endl;
            goto stat;
        }
        break;
case 2:
    
        cout << "\nEnter the modified Household ID :";
        cin >> ID[b];
        
        for(int j=0;j<n;j++) {
            if(ID[b]==ID[j] && b!=j) {
                cout<<"Duplicate ID detected"<<endl;
                
                cout << "\nEnter the Household_ID :";
                cin >> ID[n-1];
            }
        }

        cout << "Enter the modified Resident Name :";
        cin.ignore();
        getline(cin, R_name[b]);

        cout << "Enter the modified Resident Block :";
        cin.ignore();
        getline(cin, Address[b]);

        cout << "Modified Contact no :";
        cin >> contact_no[b];
        statu:
        cout << "Modified Service Status(Active / Inactive) :";
        cin >> status[b];
        if(status[b]!="active" && status[b]!="Active" && status[b]!="Inactive" && status[b]!="inactive") {
            cout<<"Invalid status"<<endl;
            goto statu;
        }
        break;

case 3:
    for(int i=b;i<n;i++) {
        ID[i]=ID[i+1];
        R_name[i]=R_name[i+1];
        Address[i]=Address[i+1];
        contact_no[i]=contact_no[i+1];
        status[i]=status[i+1];
    }
    n--;
    cout<<"The Details of Resident with ID-"<<a<<" were deleted successfully"<<endl;
    break;
    
case 4:
    cout<<"\n\nDetails of Resident"<<b+1<<":\n";
        cout << "Household ID :"<<ID[b]<<endl;

        cout << "Resident Name :"<<R_name[b]<<endl;

        cout << "Enter the Resident Block :"<<Address[b]<<endl;
        
        cout << "Contact no :"<< contact_no[b]<<endl;

        cout << "Service Status :"<< status[b]<<endl;
        break;

case 5:
    if(status[b]=="Active" || status[b]=="active") {
        cout<<"The service stautus of Household-"<<ID[b]<<" were active initially"<<endl;
    }
    else {
        cout<<"Service status of Household-"<<ID[b]<<" was Activated successfully"<<endl;
    }
    break;
    
case 6:
   if(status[b]=="Inactive" || status[b]=="inactive") {
        cout<<"The service stautus of Household-"<<ID[b]<<" were deactive initially"<<endl;
    }
    else {
        cout<<"Service status of Household-"<<ID[b]<<" was deactivated successfully"<<endl;
    }
    break;
    
case 7:
cout<<"Exited successfully\n";
break;
default:
cout<<"Invalid Choice-Exited";
    }
   }
   ofstream file("Residents Details");
   
   for(int i =0; i < n; i++){
       
       file <<"\n\nDetails of Resident-"<<i+1<<":\n";
       file << "Household ID :"<<ID[i]<<endl;

       file << "Resident Name :"<<R_name[i]<<endl;

        file << "Enter the Resident Block :"<<Address[i]<<endl;
        
        file << "Contact no :"<< contact_no[i]<<endl;

        file << "Service Status :"<< status[i]<<endl;
       
   }
   
   file.close();
 }
 
 public:
     string caname,des,ins;
     char y;
     int wid;
     vector<string>cname,desc,inst; 
     vector<int>cid;
     vector<char>Y;
void waste() {
    do{
    cout<<"\n\nEnter the Waste Category Details:\n";
    catname:
    cout<<"Enter the Category Name:";
    cin.ignore();
    getline(cin,caname);
    if(caname==" ") {
        cout<<"Name is missing"<<endl;
        goto catname;
    }
    cname.push_back(caname);
    cout<<"Enter the Waste Category ID:";
    cin>>wid;
    cid.push_back(wid);
    cout<<"Enter the Category Description:";
    cin.ignore();
    getline(cin,des);
    desc.push_back(des);
    cout<<"Enter Handling Instructions:";
    cin.ignore();
    getline(cin,ins);
    inst.push_back(ins);
    cout<<"Whether the category is Recyclable (Y/N):";
    cin>>y;
    Y.push_back(y);
    ofstream file("Waste Category Details");
    int i=0;
    file<<"Waste Category Name: "<<cname[i];
    file << "Waste Category ID: "<<cid[i]<<endl;
    file << "Category Description: "<<desc[i]<< endl;
    file << "Handling Instructions: "<<inst[i]<< endl;
    file << "Recyclable:"<<y<<endl;
    i++;
    file.close();
    cout<<"Do you want to add more Categories:(Y/N):";
    cin>>y;
    } while(y=='y' || y=='Y');
    
}

public: 

int r;
int R_ID[100];
int date[100];
string wCat[100];
int E_quantity[100];
vector<string>cstatus{20,"Pending"};

void collection_req() {
    cout<<"Enter the number of Collection requests:";
    cin>>r;
    for(int k=0;k<r;k++) {
cout<<"\n\nEnter the Collection Request"<<k+1<<"Details:\n";
    cout << "Request_ID :";
    cin >> R_ID[k];
    
    cout << "Date (0-31) :";
    cin >> date[k];
    
    wCa:
    
    cout << "Waste Category :";
    getline(cin,wCat[k]);
    
    int count = 0;
    
    for(int i=0; i < cname.size();i++){
        
    if(wCat[k] == cname[i]){
        
        count++;
    }
        
        if (count == 1){
            
            break;
        }
        
    }
    
    if(count == 0){
        
        cout << "Invalid Category" << endl;
        
        goto wCa;
    }
    
    EQ:
    
    cout << "Estimated Quantity(in kg) :";
    cin >> E_quantity[k];

            if(E_quantity[k] <= 0){
                
                cout << "Invalid Quantity" << endl;
                
                goto EQ;
            }
   
}
}
public:
    int vid[100],capacity[100],k;
    string staff[100],area[100],availability[100];
    
    void vehicle() {
    cout<<"\n\nEnter the Vehicle and Staff Details:\n";
    cout<<"Enter number of Vehicles: ";
    cin>>k;

    for(int i=0;i<k;i++) {
    cout<<"\nEnter Vehicle-"<<i+1<<" details:\n";
    vid:
    cout<<"Vehicle ID:";
    cin>>vid[i];
    for(int j=0;j<i;j++) {
        if(vid[i]==vid[j]) {
            cout<<"Duplicate Vehicle ID:";
            goto vid;
        }
    }
    cout<<"Staff / Team Name:";
    cin.ignore();
    getline(cin,staff[i]);
    cout<<"Capacity (kg):";
    cin>>capacity[i];
    avail:
    cout<<"Availability (Available/Unavailable):";
    cin>>availability[i];
    if(availability[i]!="Available" && availability[i]!="available" && availability[i]!="Unavailable" && availability[i]!="unavailable") {
        cout<<"Invalid availability"<<endl;
            goto avail;
    }
    if(availability[i]=="available" || availability[i]=="Available") {
    int are=0;
    block:
    cout<<"Assigned Block:";
    cin.ignore();
    getline(cin,area[i]);
    
    for(int j=0;j<n;j++) {
        if(area[i]==Address[j]) {
            are++;
        }
    }
    if(are<=0) {
        cout<<"Invalid Block Assignment\n";
        goto block;
        
    }
    }
    }
    }
    
    
};


int main(){
    int noR;
    cout << "Enter No.of Residents :";
    cin >> noR;
   
    Resident r(noR);
    r.disp();
    r.waste();
    r.collection_req();
    r.vehicle();
    

    return 0;
}
