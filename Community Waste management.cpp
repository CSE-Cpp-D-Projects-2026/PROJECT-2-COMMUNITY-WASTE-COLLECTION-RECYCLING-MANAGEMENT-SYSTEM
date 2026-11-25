#include <iostream>
#include <string>
#include <vector>
using namespace std;

class Resident{
         public:
        
         int choice;
         int ID[100];
         string R_name[100];
         string Address[100];
         long long contact_no[100];
         string status[100];

        void disp(int n){
        
        for(int i=0;i<n;i++) {
        cout<<"\n\nEnter the detail of Resident-"<<i+1<<":\n";
        id:
        cout << "\nEnter the Household_ID :";
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

        cout << "Enter the Resident Address :";
        cin.ignore();
        getline(cin, Address[i]);

        cout << "Contact no :";
        cin >> contact_no[i];
         
        cout << "Service Status(Active / Inactive) :";
        cin >> status[i];
        }
        
        cout<<"Do you want to perform any of the following operations(1-7):\n";
        cout<<"1.Add\n2.Modify\n3.delete\n4.search\n5.display\n6.activate\n7.Deactivate\n";
        
        cin >> choice;

        switch(choice){

case 1: 

n = n+1;

 cout<<"\n\nEnter the detail of Resident-"<<n<<":\n";
        cout << "\nEnter the Household_ID :";
        cin >> ID[n-1];
        
        for(int j=0;j<n;j++) {
            if(ID[n-1]==ID[j]) {
                cout<<"Duplicate ID detected"<<endl;
                
                cout << "\nEnter the Household_ID :";
                cin >> ID[n-1];
            }
        }

        cout << "Enter the Resident Name :";
        cin.ignore();
        getline(cin, R_name[n-1]);

        cout << "Enter the Resident Address :";
        cin.ignore();
        getline(cin, Address[n-1]);

        cout << "Contact no :";
        cin >> contact_no[n-1];
         
        cout << "Service Status(Active / Inactive) :";
        cin >> status[n-1];
        }
        
    }

};







int main(){

    int noR;
    cout << "Enter No.of Residents :";
    cin >> noR;

    cout << " " << endl;
   
    Resident r1;
    r1.disp(noR);

    return 0;
}