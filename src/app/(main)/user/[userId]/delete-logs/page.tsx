import { getDeleteProplogs } from "@/actions/propertyActions";
import { getUserByKindeId } from "@/actions/userActions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function AllBookingsdelLogs(props: Props) {
  const params = await props.params;
  const { userId } = params;
  const user = await getUserByKindeId(userId);

  if (!user || !user.id) {
    return <h1>User Not Found</h1>;
  }

  // Fetch delete logs sorted in ascending and descending order
  const deleteLogsAsc = await getDeleteProplogs(user?.id);
  const deleteLogsDesc = await getDeleteProplogs(user?.id);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-4xl bg-white shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-gray-700">
            Deleted Property Logs
          </CardTitle>
          <CardDescription className="text-gray-500">
            Logs of properties deleted by {user.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deleteLogsAsc && deleteLogsAsc.length > 0 ? (
            <>
              <h2 className="text-lg font-medium my-4">Sorted by Price: Low to High</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell className="font-bold">Property Name</TableCell>
                    <TableCell className="font-bold">Price</TableCell>
                    <TableCell className="font-bold">Deleted On</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deleteLogsAsc.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.name}</TableCell>
                      <TableCell>${log.price.toLocaleString()}</TableCell>
                      <TableCell>{new Date(log.deletedAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <h2 className="text-lg font-medium my-4">Sorted by Price: High to Low</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell className="font-bold">Property Name</TableCell>
                    <TableCell className="font-bold">Price</TableCell>
                    <TableCell className="font-bold">Deleted On</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deleteLogsDesc?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.name}</TableCell>
                      <TableCell>${log.price.toLocaleString()}</TableCell>
                      <TableCell>{new Date(log.deletedAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <h2 className="text-xl font-medium text-gray-600">No Delete Logs Found</h2>
              <p className="text-gray-500">You have no deleted properties logged in the system.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
