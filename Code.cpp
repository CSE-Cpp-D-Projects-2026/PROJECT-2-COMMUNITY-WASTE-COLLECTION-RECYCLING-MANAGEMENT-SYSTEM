#include <iostream>
#include <string>
#include <vector>
using namespace std;

class Resident{
         public:

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
        
        cout<<"Do you want to perform any of the following operations:\n";
        cout<<"1.Add\n2.Modify\n3.delete\n4.search"
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